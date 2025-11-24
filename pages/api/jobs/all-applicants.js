// pages/api/jobs/all-applicants.js
// FIXED - Only shows applicants for RECRUITER'S jobs (not all companies)

import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ========================================
    // CRITICAL: Get recruiter ID from session
    // ========================================
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: "Not authenticated",
        applicants: [],
        total: 0,
      });
    }

    const recruiterId = req.user.id;
    console.log("📊 Fetching applicants for recruiter:", recruiterId);

    // ========================================
    // STEP 1: Get ONLY this recruiter's jobs
    // ========================================
    const recruiterJobsSnapshot = await adminDb
      .collection("jobs")
      .where("recruiterId", "==", recruiterId)
      .get();

    if (recruiterJobsSnapshot.empty) {
      console.log("⚠️ Recruiter has no jobs posted");
      return res.status(200).json({
        applicants: [],
        total: 0,
      });
    }

    // Get job IDs and build jobs map
    const recruiterJobIds = [];
    const jobsMap = {};

    recruiterJobsSnapshot.forEach((doc) => {
      const jobData = doc.data();
      recruiterJobIds.push(doc.id);
      jobsMap[doc.id] = {
        title: jobData.title || "Unknown Job",
        company: jobData.company || "",
      };
    });

    console.log(`📋 Recruiter has ${recruiterJobIds.length} jobs posted`);

    // ========================================
    // STEP 2: Get applications ONLY for recruiter's jobs
    // ========================================
    const applicationsSnapshot = await adminDb
      .collection("applications")
      .orderBy("createdAt", "desc")
      .get();

    // Filter to only applications for this recruiter's jobs
    const relevantApplications = [];
    applicationsSnapshot.forEach((doc) => {
      const app = doc.data();
      if (app.jobId && recruiterJobIds.includes(app.jobId)) {
        relevantApplications.push({
          id: doc.id,
          ...app,
        });
      }
    });

    console.log(`📦 Found ${relevantApplications.length} applications for recruiter's jobs`);

    if (relevantApplications.length === 0) {
      return res.status(200).json({
        applicants: [],
        total: 0,
      });
    }

    // ========================================
    // STEP 3: Get unique student IDs
    // ========================================
    const studentIds = new Set();
    relevantApplications.forEach((app) => {
      if (app.studentId) {
        studentIds.add(app.studentId);
      }
    });

    console.log(`👥 Found ${studentIds.size} unique candidates`);

    // ========================================
    // STEP 4: Fetch user details
    // ========================================
    const usersMap = {};
    for (const userId of studentIds) {
      try {
        // Try users collection first
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          usersMap[userId] = {
            name: userData.name || userData.displayName || userData.firstName || null,
            email: userData.email || userId,
          };
        }

        // If no name found, try candidateProfiles
        if (!usersMap[userId]?.name) {
          const profileDoc = await adminDb.collection("candidateProfiles").doc(userId).get();
          if (profileDoc.exists) {
            const profileData = profileDoc.data();
            const user = profileData.user || {};
            const name = user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.name || user.displayName || null;
            
            if (name) {
              usersMap[userId] = {
                ...usersMap[userId],
                name: name,
              };
            }
          }
        }

        // Final fallback to email username
        if (!usersMap[userId]?.name) {
          usersMap[userId] = {
            ...usersMap[userId],
            name: (usersMap[userId]?.email || userId).split('@')[0],
          };
        }
      } catch (err) {
        console.error(`Error fetching user ${userId}:`, err);
        usersMap[userId] = {
          name: userId.split('@')[0],
          email: userId,
        };
      }
    }

    // ========================================
    // STEP 5: Build applicants array
    // ========================================
    const applicants = [];

    relevantApplications.forEach((app) => {
      const job = jobsMap[app.jobId] || { title: "Unknown Job", company: "" };
      const user = usersMap[app.studentId] || { name: "Unknown", email: "" };

      applicants.push({
        id: app.id,
        applicationId: app.id,
        studentId: app.studentId,
        jobId: app.jobId,
        
        name: user.name,
        email: user.email,
        
        jobTitle: job.title,
        company: job.company,
        
        status: app.status || "APPLIED",
        
        appliedDate: app.createdAt || null,
        updatedDate: app.updatedAt || null,
      });
    });

    console.log(`✅ Returning ${applicants.length} applicants for recruiter's jobs`);

    return res.status(200).json({
      applicants,
      total: applicants.length,
    });
  } catch (error) {
    console.error("❌ Dashboard applicants API error:", error);
    return res.status(500).json({
      error: "Failed to fetch applicants",
      details: error.message,
    });
  }
}