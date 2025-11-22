// pages/api/jobs/applied.js
const {
  getCandidateApplications,
} = require("../../../server/db/jobs");

export default async function handler(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const apps = await getCandidateApplications(req.user.id);
    return res.status(200).json({
      applications: apps.map((a) => ({
        ...a,
        createdAt: a.createdAt?.toISOString?.() || null,
        updatedAt: a.updatedAt?.toISOString?.() || null,
      })),
    });
  } catch (err) {
    console.error("API /jobs/applied error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
