// pages/api/jobs/index.js
const {
  getOpenJobs,
  createJob,
} = require("../../../server/db/jobs");

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // List open jobs
      const jobs = await getOpenJobs();
      return res.status(200).json({
        jobs: jobs.map((j) => ({
          ...j,
          createdAt: j.createdAt?.toISOString?.() || null,
          updatedAt: j.updatedAt?.toISOString?.() || null,
          deadline: j.deadline?.toISOString?.() || null,
        })),
      });
    }

    if (req.method === "POST") {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const job = await createJob(req.user.id, req.body || {});
      return res.status(201).json({
        job: {
          ...job,
          createdAt: job.createdAt?.toISOString?.() || null,
          updatedAt: job.updatedAt?.toISOString?.() || null,
          deadline: job.deadline?.toISOString?.() || null,
        },
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end();
  } catch (err) {
    console.error("API /jobs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
