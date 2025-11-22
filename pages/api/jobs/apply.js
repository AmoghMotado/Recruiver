// pages/api/jobs/apply.js
const { applyToJob } = require("../../../server/db/jobs");

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).end();
    }
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { jobId } = req.body || {};
    if (!jobId) {
      return res.status(400).json({ message: "jobId is required" });
    }

    const app = await applyToJob(jobId, req.user.id);
    return res.status(201).json({
      application: {
        ...app,
        createdAt: app.createdAt?.toISOString?.() || null,
        updatedAt: app.updatedAt?.toISOString?.() || null,
      },
    });
  } catch (err) {
    console.error("API /jobs/apply error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
