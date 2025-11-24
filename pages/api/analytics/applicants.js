// pages/api/analytics/applicants.js
/**
 * Analytics-specific endpoint that fetches applicants for analytics dashboard
 * This is separate from /api/jobs/all-applicants to avoid confusion
 * 
 * Returns applicants with enriched data for charts and visualizations
 */

const BASE_URL = process.env.SERVER_URL || "http://localhost:4000";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Call the Express endpoint that has proper auth
    const url = `${BASE_URL}/api/jobs/recruiter-candidates`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // Forward cookies so Express can read JWT
        cookie: req.headers.cookie || "",
      },
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error("Upstream error:", upstream.status, errorText);
      
      // Return empty array instead of failing
      return res.status(200).json({
        applicants: [],
        total: 0,
      });
    }

    const data = await upstream.json();
    const candidates = data.candidates || [];

    // Transform candidates into analytics format
    const applicants = candidates.map((c) => ({
      // Basic info
      id: c.applicationId || c.id,
      applicationId: c.applicationId || c.id,
      name: c.name || "Unknown",
      email: c.email || "",
      
      // Job info
      jobTitle: c.jobTitle || "Unknown Position",
      company: c.company || "",
      
      // Status and scores
      status: c.status || "APPLIED",
      atsScore: c.score || 0,
      aptitudeScore: c.aptitudeScore || null,
      videoScore: c.videoInterviewScore || null,
      
      // Dates
      appliedDate: c.appliedDate || c.createdAt || null,
      
      // Additional data for analytics
      resumePath: c.resumePath || null,
      
      // For analytics calculations
      experienceYears: 0, // Will be calculated from resume/profile
      skills: [], // Will be extracted from profile
      profileCompletion: 50, // Default, can be enhanced
      
      // Metadata
      createdAt: c.createdAt || c.appliedDate || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }));

    return res.status(200).json({
      applicants,
      total: applicants.length,
    });
  } catch (error) {
    console.error("Analytics applicants API error:", error);
    
    // Return empty array on error instead of 500
    return res.status(200).json({
      applicants: [],
      total: 0,
    });
  }
}