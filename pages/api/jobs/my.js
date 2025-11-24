// pages/api/jobs/my.js
// UPDATED - Adds applicant count to each job

import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    // Get recruiter ID from session
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const recruiterId = req.user.id;

    console.log(`📋 Fetching jobs for recruiter: ${recruiterId}`);

    // Fetch recruiter's jobs
    const jobsSnapshot = await adminDb
      .collection("jobs")
      .where("recruiterId", "==", recruiterId)
      .orderBy("createdAt", "desc")
      .get();

    if (jobsSnapshot.empty) {
      return res.status(200).json({
        jobs: [],
        total: 0,
      });
    }

    // Get all job IDs
    const jobIds = jobsSnapshot.docs.map(doc => doc.id);

    // Count applications for each job
    const applicationsSnapshot = await adminDb
      .collection("applications")
      .get();

    const applicationCounts = {};
    applicationsSnapshot.forEach((doc) => {
      const app = doc.data();
      if (app.jobId && jobIds.includes(app.jobId)) {
        applicationCounts[app.jobId] = (applicationCounts[app.jobId] || 0) + 1;
      }
    });

    // Build jobs array with applicant counts
    const jobs = jobsSnapshot.docs.map((doc) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        title: data.title || "Untitled Job",
        company: data.company || "",
        role: data.role || "",
        location: data.location || "",
        salary: data.salary || "",
        salaryRange: data.salaryRange || "",
        experience: data.experience || "",
        description: data.description || "",
        requiredSkills: data.requiredSkills || [],
        openings: data.openings || 1,
        status: data.status || "OPEN",
        
        // Applicant count
        applicants: applicationCounts[doc.id] || 0,
        applicantsCount: applicationCounts[doc.id] || 0,
        
        // Dates
        deadline: data.deadline
          ? data.deadline._seconds
            ? new Date(data.deadline._seconds * 1000).toISOString()
            : new Date(data.deadline).toISOString()
          : null,
        createdAt: data.createdAt
          ? data.createdAt._seconds
            ? new Date(data.createdAt._seconds * 1000).toISOString()
            : new Date(data.createdAt).toISOString()
          : null,
        updatedAt: data.updatedAt
          ? data.updatedAt._seconds
            ? new Date(data.updatedAt._seconds * 1000).toISOString()
            : new Date(data.updatedAt).toISOString()
          : null,
      };
    });

    console.log(`✅ Returning ${jobs.length} jobs`);

    return res.status(200).json({
      jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error("❌ Jobs API error:", error);
    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
}