// pages/api/mock-interview/start.js
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
  console.log("✅ Firebase Admin initialised in /api/mock-interview/start");
}

const db = getFirestore();

const INTERVIEW_CONFIG = {
  questionsCount: 5,
  questionTimeLimit: 120, // seconds per question
  totalTimeLimit: 600, // 10 minutes total
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId } = req.body || {};

    console.log("[/api/mock-interview/start] Received request:", { userId });

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      console.error(
        "[/api/mock-interview/start] Invalid userId:",
        userId
      );
      return res.status(400).json({
        error: "userId is required and must be a non-empty string",
      });
    }

    const trimmedUserId = userId.trim();
    const interviewId = `interview_${uuidv4()}`;
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
      error: error.message || "Failed to start interview",
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}