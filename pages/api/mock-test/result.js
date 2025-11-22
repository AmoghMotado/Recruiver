// pages/api/mock-test/result.js
import { attemptStore, getUserId } from "./questionBank";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);
  const { attemptId } = req.query;

  if (!attemptId) {
    return res.status(400).json({ error: "Missing attemptId" });
  }

  const attempt = attemptStore[attemptId];

  if (!attempt || attempt.userId !== userId) {
    return res.status(404).json({ error: "Result not found" });
  }

  return res.status(200).json({
    attemptId,
    scores: attempt.scores,
    violations: attempt.violations,
  });
}
