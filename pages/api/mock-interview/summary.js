// pages/api/mock-interview/summary.js
// The signed-in candidate's mock interview history: attempt count and latest attempt.
import { db } from "../../../server/lib/firebaseAdmin";
import { withAuth } from "../../../server/lib/session";

async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Filtered by user only (no orderBy) so no composite index is required
    const snap = await db
      .collection("mockInterviewAttempts")
      .where("userId", "==", req.user.id)
      .get();

    const attempts = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return res.status(200).json({
      totalAttempts: attempts.length,
      latestAttempt: attempts[0] || null,
    });
  } catch (err) {
    console.error("[mock-interview/summary] Error:", err);
    return res.status(500).json({ error: "Failed to load mock interview history" });
  }
}

export default withAuth(handler, { roles: ["CANDIDATE"] });
