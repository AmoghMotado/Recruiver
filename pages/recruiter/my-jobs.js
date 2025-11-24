// pages/api/recruiter/my-jobs.js
/**
 * Proxy to Express /api/jobs/my endpoint
 * Forwards cookies so Express auth middleware works
 */

const BASE_URL = process.env.SERVER_URL || "http://localhost:4000";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const url = `${BASE_URL}/api/jobs/my`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // Forward cookies so Express can read JWT
        cookie: req.headers.cookie || "",
      },
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      console.error("Upstream /api/jobs/my error:", upstream.status, errorText);
      
      return res.status(upstream.status).json({
        message: errorText || "Failed to load jobs",
        jobs: [],
      });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error proxying my jobs:", err);
    return res.status(500).json({ 
      message: "Failed to load jobs",
      jobs: [],
    });
  }
}