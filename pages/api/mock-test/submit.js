// pages/api/mock-test/submit.js
import {
  attemptStore,
  getUserId,
  scoreAttempt,
  recordViolations,
} from "./questionBank";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);
  const { attemptId, answers, violations } = req.body || {};

  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const attempt = attemptStore[attemptId];

  if (!attempt || attempt.userId !== userId) {
    return res.status(404).json({ error: "Attempt not found" });
  }

  // record violations from frontend (tab switches, etc.)
  if (violations) {
    recordViolations(attemptId, violations);
  }

  const scores = scoreAttempt(attempt, answers);
  attempt.scores = scores;
  attempt.submittedAt = Date.now();

  return res.status(200).json({
    attemptId,
    scores,
    violations: attempt.violations,
  });
}
