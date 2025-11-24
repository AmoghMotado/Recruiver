// pages/api/analytics/candidates.js
// SIMPLIFIED VERSION - Fetches exactly like your candidates page does

import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🔍 Fetching candidates for analytics...");

    // ========================================
    // STEP 1: Fetch ALL applications from Firestore
    // ========================================
    const applicationsRef = adminDb.collection("applications");
    const applicationsSnapshot = await applicationsRef.get();

    console.log(`📦 Found ${applicationsSnapshot.size} applications`);

    if (applicationsSnapshot.empty) {
      return res.status(200).json({
        candidates: [],
        total: 0,
        message: "No applications found",
      });
    }

    // ========================================
    // STEP 2: Get job details for each application
    // ========================================
    const jobsMap = {};
    const jobIds = new Set();

    applicationsSnapshot.forEach((doc) => {
      const app = doc.data();
      if (app.jobId) {
        jobIds.add(app.jobId);
      }
    });

    console.log(`📋 Found ${jobIds.size} unique jobs`);

    // Fetch all jobs
    for (const jobId of jobIds) {
      try {
        const jobDoc = await adminDb.collection("jobs").doc(jobId).get();
        if (jobDoc.exists) {
          const jobData = jobDoc.data();
          jobsMap[jobId] = {
            title: jobData.title || "Unknown Job",
            company: jobData.company || "Unknown Company",
          };
        }
      } catch (err) {
        console.error(`Error fetching job ${jobId}:`, err);
      }
    }

    // ========================================
    // STEP 3: Get user details for each application
    // ========================================
    const usersMap = {};
    const userIds = new Set();

    applicationsSnapshot.forEach((doc) => {
      const app = doc.data();
      if (app.studentId) {
        userIds.add(app.studentId);
      }
    });

    console.log(`👥 Found ${userIds.size} unique users`);

    // Fetch all users
    for (const userId of userIds) {
      try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          usersMap[userId] = {
            name: userData.name || userData.displayName || userData.firstName || userData.email?.split('@')[0] || "Unknown Candidate",
            email: userData.email || "",
            phone: userData.phone || "",
          };
        } else {
          // User doc doesn't exist, use userId as fallback
          usersMap[userId] = {
            name: userId.split('@')[0] || "Unknown Candidate",
            email: userId,
            phone: "",
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        usersMap[userId] = {
          name: userId.split('@')[0] || "Unknown Candidate",
          email: userId,
          phone: "",
        };
      }
    }

    // ========================================
    // STEP 4: Try to get profile data (skills, experience, etc.)
    // Also check for name in profiles if not in users
    // ========================================
    const profilesMap = {};
    
    for (const userId of userIds) {
      try {
        const profileDoc = await adminDb.collection("candidateProfiles").doc(userId).get();
        if (profileDoc.exists) {
          const profileData = profileDoc.data();
          const candidate = profileData.candidate || {};
          const user = profileData.user || {};
          
          profilesMap[userId] = {
            skills: candidate.skills || [],
            experience: candidate.experience || [],
            education: candidate.education || [],
            headline: candidate.headline || "",
            summary: candidate.summary || "",
            projects: candidate.projects || [],
            links: candidate.links || [],
            // Get name from profile if not already found
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.name || user.displayName || null,
          };
        }
      } catch (err) {
        console.error(`Error fetching profile ${userId}:`, err);
      }
    }

    // ========================================
    // STEP 5: Build candidate objects with all data
    // ========================================
    const candidatesMap = {};

    applicationsSnapshot.forEach((doc) => {
      const app = doc.data();
      const studentId = app.studentId;
      const jobId = app.jobId;

      if (!studentId) return;

      // Initialize candidate if not exists
      if (!candidatesMap[studentId]) {
        const user = usersMap[studentId] || {};
        const profile = profilesMap[studentId] || {};

        // Get name from profile first, then user, then fallback to email
        const candidateName = profile.name || user.name || user.email?.split('@')[0] || "Unknown Candidate";

        candidatesMap[studentId] = {
          id: studentId,
          name: candidateName,
          email: user.email || studentId,
          phone: user.phone || "",
          
          headline: profile.headline || "",
          summary: profile.summary || "",
          
          skills: profile.skills || [],
          education: profile.education || [],
          experience: profile.experience || [],
          projects: profile.projects || [],
          links: profile.links || [],
          
          // Computed fields
          experienceYears: calculateExperienceYears(profile.experience || []),
          profileCompletion: calculateProfileCompletion(user, profile),
          
          applications: [],
          totalApplications: 0,
          
          createdAt: null,
          updatedAt: null,
        };
      }

      // Add application details
      const job = jobsMap[jobId] || { title: "Unknown Job", company: "" };
      const appliedDate = app.createdAt;
      
      candidatesMap[studentId].applications.push({
        jobId: jobId,
        jobTitle: job.title,
        company: job.company,
        status: app.status || "APPLIED",
        appliedAt: appliedDate,
      });

      candidatesMap[studentId].totalApplications++;

      // Set creation date to earliest application
      if (appliedDate) {
        const appDate = appliedDate._seconds 
          ? new Date(appliedDate._seconds * 1000)
          : new Date(appliedDate);
        
        if (!candidatesMap[studentId].createdAt || appDate < new Date(candidatesMap[studentId].createdAt)) {
          candidatesMap[studentId].createdAt = appDate.toISOString();
        }
      }
    });

    // Convert to array
    const candidates = Object.values(candidatesMap);

    // Sort by most recent application
    candidates.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    console.log(`✅ Returning ${candidates.length} candidates`);

    return res.status(200).json({
      candidates,
      total: candidates.length,
    });
  } catch (error) {
    console.error("❌ Analytics API error:", error);
    return res.status(500).json({
      error: "Failed to fetch candidate analytics",
      details: error.message,
    });
  }
}

/**
 * Calculate total years of experience
 */
function calculateExperienceYears(experiences) {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return 0;
  }

  let totalMonths = 0;

  experiences.forEach((exp) => {
    const start = exp.start || exp.startDate;
    const end = exp.end || exp.endDate;
    
    if (!start) return;

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    if (isNaN(startDate.getTime())) return;

    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());

    totalMonths += Math.max(0, months);
  });

  return Math.round((totalMonths / 12) * 10) / 10;
}

/**
 * Calculate profile completion percentage
 */
function calculateProfileCompletion(user, profile) {
  let filled = 0;
  let total = 0;

  // Basic info (3 fields)
  total += 3;
  if (user.name?.trim()) filled += 1;
  if (user.email?.trim()) filled += 1;
  if (user.phone?.trim()) filled += 1;

  // Bio (2 fields)
  total += 2;
  if (profile.headline?.trim()) filled += 1;
  if (profile.summary?.trim()) filled += 1;

  // Skills (1 field)
  total += 1;
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    filled += 1;
  }

  // Arrays (3 fields)
  total += 3;
  if (Array.isArray(profile.education) && profile.education.length > 0) {
    filled += 1;
  }
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    filled += 1;
  }
  if (Array.isArray(profile.projects) && profile.projects.length > 0) {
    filled += 1;
  }

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}