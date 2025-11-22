// pages/api/jobs/my.js
const { getRecruiterJobs } = require("../../../server/db/jobs");

export default async function handler(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const jobs = await getRecruiterJobs(req.user.id);
    return res.status(200).json({
      jobs: jobs.map((j) => ({
        ...j,
        createdAt: j.createdAt?.toISOString?.() || null,
        updatedAt: j.updatedAt?.toISOString?.() || null,
        deadline: j.deadline?.toISOString?.() || null,
      })),
    });
  } catch (err) {
    console.error("API /jobs/my error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
