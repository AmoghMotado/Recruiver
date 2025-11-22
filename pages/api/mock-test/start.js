// pages/api/mock-test/start.js
import {
  createAttempt,
  getUserId,
  attemptStore,
} from "./questionBank";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = getUserId(req);

  // If user already has an active attempt (not submitted), reuse it
  const existingAttemptId = Object.keys(attemptStore).find((id) => {
    const a = attemptStore[id];
    return a.userId === userId && !a.submittedAt;
  });

  if (existingAttemptId) {
    const a = attemptStore[existingAttemptId];
    return res.status(200).json({
      attemptId: existingAttemptId,
      questions: a.questions.map(stripCorrectAnswers),
    });
  }

  const { attemptId, questions } = createAttempt(userId);

  return res.status(200).json({
    attemptId,
    questions: questions.map(stripCorrectAnswers),
  });
}

function stripCorrectAnswers(q) {
  const { correctIndex, ...rest } = q;
  return rest;
}
