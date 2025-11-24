// pages/api/recruiter/all-applicants.js
/**
 * Direct passthrough to Express route handler
 * No proxy needed - Express is integrated with Next.js
 */

export default async function handler(req, res) {
  try {
    // Import the Express route handler directly
    const jobsRouter = require("../../../server/routes/jobs");
    
    // Or call the database function directly
    const { getRecruiterCandidates } = require("../../../server/db/jobs");
    
    if (!req.user) {
      return res.status(200).json({
        applicants: [],
        total: 0,
      });
    }

    // Get candidates for this recruiter
    const candidates = await getRecruiterCandidates(req.user.id);
    
    const applicants = (candidates || []).map((c) => ({
      id: c.applicationId || c.id,
      applicationId: c.applicationId || c.id,
      name: c.name || "Unknown",
      email: c.email || "",
      jobTitle: c.jobTitle || "",
      company: c.company || "",
      status: c.status || "APPLIED",
      score: c.score || 0,
      aptitudeScore: c.aptitudeScore || null,
      videoInterviewScore: c.videoInterviewScore || null,
      appliedDate: c.appliedDate || c.createdAt,
      resumePath: c.resumePath || null,
      stage: c.stage || 0,
    }));

    return res.status(200).json({
      applicants,
      total: applicants.length,
    });
  } catch (err) {
    console.error("Error loading applicants:", err);
    return res.status(200).json({ 
      applicants: [],
      total: 0,
    });
  }
}