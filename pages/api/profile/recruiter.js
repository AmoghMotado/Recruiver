// pages/api/profile/recruiter.js
/**
 * Proxy to Express /api/profile/recruiter endpoint
 * Forwards cookies so Express auth middleware works
 */

const BASE_URL = process.env.SERVER_URL || "http://localhost:4000";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const url = `${BASE_URL}/api/profile/recruiter`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        // Forward cookies so Express can read JWT
        cookie: req.headers.cookie || "",
      },
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    // If Express returns 401/403, return empty profile instead of error
    if (upstream.status === 401 || upstream.status === 403) {
      return res.status(200).json({
        user: {
          name: "Recruiter",
          email: "",
        },
      });
    }

    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Error proxying recruiter profile:", err);
    
    // Return empty profile on error instead of failing
    return res.status(200).json({
      user: {
        name: "Recruiter",
        email: "",
      },
    });
  }
}