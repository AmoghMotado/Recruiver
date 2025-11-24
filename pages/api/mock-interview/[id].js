// pages/api/mock-interview/[id].js
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialise Firebase Admin once (shared with other API routes)
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
  console.log("✅ Firebase Admin initialised in /api/mock-interview/[id]");
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.query;
  const interviewId = Array.isArray(id) ? id[0] : id;

  if (!interviewId) {
    return res
      .status(400)
      .json({ success: false, message: "interviewId is required" });
  }

  try {
    console.log("[mock-interview/[id]] Fetching interview:", interviewId);

    // 1) Try to load the main interview session document first
    const sessionRef = db.collection("mockInterviews").doc(interviewId);
    const sessionSnap = await sessionRef.get();

    let attemptData = null;

    if (sessionSnap.exists) {
      const session = sessionSnap.data() || {};

      // If we stored latestAttemptId in submit.js, grab that attempt
      if (session.latestAttemptId) {
        const attemptSnap = await db
          .collection("mockInterviewAttempts")
          .doc(session.latestAttemptId)
          .get();

        if (attemptSnap.exists) {
          attemptData = { id: attemptSnap.id, ...attemptSnap.data() };
        }
      }

      // Build the final interview payload combining session + attempt
      const interview = {
        id: interviewId,

        // high-level info
        overallScore:
          session.overallScore ??
          attemptData?.overallScore ??
          null,
        videoUrl: session.videoUrl || attemptData?.videoUrl || null,
        transcript: session.transcript || attemptData?.transcript || "",

        // scores from attempt document (5 parameters)
        appearance: attemptData?.appearance ?? null,
        language: attemptData?.language ?? null,
        confidence: attemptData?.confidence ?? null,
        contentDelivery: attemptData?.contentDelivery ?? null,
        knowledge: attemptData?.knowledge ?? null,

        // extra insights
        sentimentScore: attemptData?.sentimentScore ?? null,
        sentimentSummary: attemptData?.sentimentSummary ?? null,
        eyeContactPercent: attemptData?.eyeContactPercent ?? null,
        eyeContactLabel: attemptData?.eyeContactLabel ?? null,
        emotionalTone: attemptData?.emotionalTone ?? null,
        wordCount: attemptData?.wordCount ?? null,
        wpm: attemptData?.wpm ?? null,
        fillerCount: attemptData?.fillerCount ?? null,
        speakingPace: attemptData?.speakingPace ?? null,
        fillerUsage: attemptData?.fillerUsage ?? null,

        createdAt: attemptData?.createdAt || session.createdAt || null,
        metrics: session.metrics || null, // raw AI metrics if you want them
      };

      return res.status(200).json({ success: true, interview });
    }

    // 2) Fallback: if the session doc doesn't exist, look up an attempt
    //    NOTE: no orderBy() here → no composite index required.
    const attemptsSnap = await db
      .collection("mockInterviewAttempts")
      .where("interviewId", "==", interviewId)
      .limit(1)
      .get();

    if (attemptsSnap.empty) {
      return res.status(404).json({
        success: false,
        message: "No interview results found for this ID.",
      });
    }

    const attemptDoc = attemptsSnap.docs[0];
    const data = attemptDoc.data() || {};

    const interview = {
      id: interviewId,
      ...data,
      overallScore: data.overallScore ?? null,
      transcript: data.transcript || "",
    };

    return res.status(200).json({ success: true, interview });
  } catch (err) {
    console.error("[mock-interview/[id]] Error loading interview:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "Failed to load interview results. Please try again later.",
    });
  }
}
