// server/routes/mockInterview.js
// Advanced AI-style mock interview pipeline (JSON API + Firebase Storage URL)

const express = require("express");
const admin = require("firebase-admin");
const { db } = require("../lib/firebaseAdmin");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Very simple heuristic “AI-style” analysis using transcript + extra stats
function analyseInterview({
  transcript = "",
  durationSec = 0,
  extraStats = {},
  eyeContactPercent = 0,
}) {
  const text = String(transcript || "");
  const lower = text.toLowerCase();

  // words + WPM
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = extraStats.totalWords || words.length;
  const minutes = Math.max(1, durationSec / 60 || 1);
  const wpm = Math.round(wordCount / minutes);

  // speaking pace buckets
  let speakingPace;
  if (wpm < 90) speakingPace = "slow";
  else if (wpm <= 160) speakingPace = "normal";
  else speakingPace = "fast";

  // filler words
  const fillerTokens = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "actually",
    "so",
    "well",
  ];
  let fillerCount = 0;
  fillerTokens.forEach((token) => {
    const regex = new RegExp(`\\b${token.replace(" ", "\\s+")}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) fillerCount += matches.length;
  });
  const fillersPerMin = fillerCount / minutes;
  let fillerUsage;
  if (fillersPerMin <= 1) fillerUsage = "low";
  else if (fillersPerMin <= 3) fillerUsage = "medium";
  else fillerUsage = "high";

  // sentiment (very rough keyword-based)
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "confident",
    "happy",
    "improve",
    "strong",
    "success",
    "excited",
    "motivated",
    "learning",
    "growth",
    "opportunity",
  ];
  const negativeWords = [
    "bad",
    "weak",
    "nervous",
    "afraid",
    "fail",
    "failure",
    "difficult",
    "problem",
    "stress",
    "stressed",
    "anxious",
  ];

  let pos = 0;
  let neg = 0;
  words.forEach((w) => {
    const lw = w.toLowerCase();
    if (positiveWords.includes(lw)) pos += 1;
    if (negativeWords.includes(lw)) neg += 1;
  });

  let sentimentScore = 50;
  if (pos + neg > 0) {
    const raw = (pos - neg) / (pos + neg); // -1 .. 1
    sentimentScore = Math.max(0, Math.min(100, Math.round(50 + raw * 50)));
  }

  let sentimentSummary = "Overall neutral, professional tone.";
  if (sentimentScore >= 75) {
    sentimentSummary =
      "Overall positive and confident emotional tone with good enthusiasm.";
  } else if (sentimentScore <= 35) {
    sentimentSummary =
      "Tone sounds a bit negative or nervous. Try to sound more confident and optimistic.";
  }

  // eye contact score + label
  const numericEyeContact = Number.isFinite(eyeContactPercent)
    ? Math.max(0, Math.min(100, Math.round(eyeContactPercent)))
    : 0;

  let eyeContactLabel = "stable";
  if (numericEyeContact < 40) eyeContactLabel = "weak";
  else if (numericEyeContact < 70) eyeContactLabel = "variable";

  // Map into 5 core scores (0–100) – simple heuristic from sentiment + pace
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

  const base = sentimentScore; // 0–100
  const appearance = clamp(60 + base * 0.2); // 60–80+
  const language = clamp(50 + base * 0.3);
  const confidence = clamp(45 + base * 0.4);
  const contentDelivery =
    speakingPace === "normal"
      ? clamp(50 + base * 0.4)
      : clamp(45 + base * 0.3);
  const knowledge = clamp(50 + base * 0.25);

  const scores = {
    appearance,
    language,
    confidence,
    contentDelivery,
    knowledge,
  };

  let emotionalTone = "Neutral and calm delivery.";
  if (sentimentScore >= 75)
    emotionalTone = "Positive, confident and engaging delivery.";
  else if (sentimentScore <= 35)
    emotionalTone =
      "Nervous or slightly negative tone; work on sounding more confident and relaxed.";

  return {
    scores,
    sentimentScore,
    sentimentSummary,
    speakingPace,
    fillerUsage,
    eyeContactPercent: numericEyeContact,
    eyeContactLabel,
    emotionalTone,
    wordCount,
    wpm,
    fillerCount,
  };
}

/* ------------------------------------------------------------------ */
/* POST /api/mock-interview/start                                    */
/* Creates a lightweight interview session document (for tracking)    */
/* ------------------------------------------------------------------ */

router.post(
  "/start",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();

      // You can later customise questions per user / role / job.
      const defaultQuestions = [
        "Tell me about yourself and your background.",
        "What are your greatest strengths and how do they apply to this role?",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "Where do you see yourself in 3-5 years?",
        "Why should we hire you for this position?",
      ];

      const docRef = await db.collection("mockInterviewSessions").add({
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "CREATED",
        questions: defaultQuestions,
      });

      return res.status(201).json({
        interviewId: docRef.id,
        questions: defaultQuestions,
      });
    } catch (err) {
      console.error("Mock interview start error:", err);
      return res
        .status(500)
        .json({ error: "Failed to start interview. Please try again." });
    }
  }
);

/* ------------------------------------------------------------------ */
/* POST /api/mock-interview/submit                                   */
/* Client already uploaded video to Firebase Storage and sends:       */
/* { interviewId, videoUrl, transcript, eyeContactPercent,            */
/*   extraStats, startedAt, endedAt }                                 */
/* ------------------------------------------------------------------ */

router.post(
  "/submit",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const {
        interviewId = null,
        videoUrl = null,
        transcript = "",
        eyeContactPercent = 0,
        extraStats = {},
        startedAt = null,
        endedAt = null,
      } = req.body || {};

      // duration – prefer explicit extraStats.totalSeconds, else derive
      let durationSec = 0;
      if (
        extraStats &&
        typeof extraStats.totalSeconds === "number" &&
        extraStats.totalSeconds > 0
      ) {
        durationSec = extraStats.totalSeconds;
      } else if (startedAt && endedAt) {
        const start = new Date(startedAt);
        const end = new Date(endedAt);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          durationSec = Math.max(0, Math.round((end - start) / 1000));
        }
      }

      // Run local “AI-style” analysis
      const analysis = analyseInterview({
        transcript,
        durationSec,
        extraStats,
        eyeContactPercent,
      });

      const core = analysis.scores;
      const overall =
        (core.appearance +
          core.language +
          core.confidence +
          core.contentDelivery +
          core.knowledge) /
        5;

      // Build Firestore document
      const attemptDoc = {
        userId,
        interviewId,
        videoUrl: videoUrl || null,
        transcript: transcript || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        startedAt: startedAt ? new Date(startedAt) : null,
        endedAt: endedAt ? new Date(endedAt) : null,
        durationSec,

        // Core 5 scores
        appearance: core.appearance,
        language: core.language,
        confidence: core.confidence,
        contentDelivery: core.contentDelivery,
        knowledge: core.knowledge,
        overallScore: Math.round(overall),

        // Analysis details
        sentimentScore: analysis.sentimentScore,
        sentimentSummary: analysis.sentimentSummary,
        speakingPace: analysis.speakingPace,
        fillerUsage: analysis.fillerUsage,
        eyeContactPercent: analysis.eyeContactPercent,
        eyeContactLabel: analysis.eyeContactLabel,
        emotionalTone: analysis.emotionalTone,
        wordCount: analysis.wordCount,
        wpm: analysis.wpm,
        fillerCount: analysis.fillerCount,

        // raw stats from client
        eyeContactFrames: extraStats.eyeContactFrames || null,
        totalFrames: extraStats.totalFrames || null,
      };

      const ref = await db.collection("mockInterviewAttempts").add(attemptDoc);
      const snap = await ref.get();

      return res.status(201).json({
        success: true,
        attempt: { id: ref.id, ...snap.data() },
      });
    } catch (err) {
      console.error("Mock interview submit error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to process interview. Please try again.",
        details: err.message,
      });
    }
  }
);

/* ------------------------------------------------------------------ */
/* (Optional) GET /api/mock-interview/latest – last attempt for user  */
/* ------------------------------------------------------------------ */

router.get(
  "/latest",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const snap = await db
        .collection("mockInterviewAttempts")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snap.empty) {
        return res.json({ attempt: null });
      }
      const doc = snap.docs[0];
      return res.json({ attempt: { id: doc.id, ...doc.data() } });
    } catch (err) {
      console.error("Mock interview latest error:", err);
      return res
        .status(500)
        .json({ error: "Failed to load latest attempt." });
    }
  }
);

module.exports = router;
