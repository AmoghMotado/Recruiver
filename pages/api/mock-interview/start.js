// pages/api/mock-interview/start.js
import { randomUUID } from "crypto";
import { db } from "../../../server/lib/firebaseAdmin";
import { withAuth } from "../../../server/lib/session";

const INTERVIEW_CONFIG = {
  questionsCount: 5,
  questionTimeLimit: 120, // seconds per question
  totalTimeLimit: 600, // 10 minutes total
};

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const trimmedUserId = req.user.id;
    const interviewId = `interview_${randomUUID()}`;
    const now = new Date().toISOString();

    console.log(
      "[/api/mock-interview/start] Creating interview session:",
      {
        interviewId,
        userId: trimmedUserId,
        timestamp: now,
      }
    );

    // Create interview session document
    const sessionData = {
      userId: trimmedUserId,
      interviewId,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
      videoUrl: null,
      transcript: null,
      metrics: null,
      latestAttemptId: null,
      config: INTERVIEW_CONFIG,
    };

    // Save to Firestore
    await db.collection("mockInterviews").doc(interviewId).set(sessionData);

    console.log(
      "[/api/mock-interview/start] Session created successfully:",
      interviewId
    );

    return res.status(200).json({
      success: true,
      interviewId,
      userId: trimmedUserId,
      config: INTERVIEW_CONFIG,
      message: "Interview session created. Ready to record.",
    });
  } catch (error) {
    console.error("[/api/mock-interview/start] Error:", error);
    return res.status(500).json({
      error: "Failed to start interview",
    });
  }
}

export default withAuth(handler, { roles: ["CANDIDATE"] });
