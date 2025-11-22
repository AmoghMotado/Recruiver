// pages/api/recruiter/candidates.js
const BASE_URL = process.env.SERVER_URL || "http://localhost:4000";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const url = `${BASE_URL}/api/jobs/recruiter-candidates`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // forward cookies so Express can read JWT
        cookie: req.headers.cookie || "",
      },
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Error proxying recruiter candidates:", err);
    res.status(500).json({ message: "Failed to load candidates" });
  }
}
