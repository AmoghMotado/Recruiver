// pages/api/mock-interview/submit.js
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { analyzeInterviewWithOpenAI } from "../../../server/ai/videoAnalysis";

// Re-use existing admin app; if not initialised, fall back to applicationDefault()
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
  console.log("✅ Firebase Admin initialised in /api/mock-interview/submit");
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const startTime = Date.now();
  const sessionId = Math.random().toString(36).substring(7);

  try {
    const {
      interviewId,
      userId,
      videoUrl,
      transcript,
      eyeContactPercent,
      extraStats,
      startedAt,
      endedAt,
    } = req.body || {};

    console.log(
      `[${sessionId}] /api/mock-interview/submit - Incoming request:`,
      {
        interviewId,
        hasUserId: !!userId,
        hasVideoUrl: !!videoUrl,
        transcriptLength: transcript ? transcript.length : 0,
        eyeContactPercent,
        extraStatsKeys: extraStats ? Object.keys(extraStats) : [],
      }
    );

    // Validate required fields
    if (!interviewId) {
      console.error(`[${sessionId}] Missing interviewId`);
      return res.status(400).json({ error: "interviewId is required" });
    }

    if (!userId) {
      console.error(`[${sessionId}] Missing userId`);
      return res.status(400).json({ error: "userId is required" });
    }

    if (!videoUrl) {
      console.error(`[${sessionId}] Missing videoUrl`);
      return res.status(400).json({ error: "videoUrl is required" });
    }

    console.log(
      `[${sessionId}] All required fields present. Starting AI analysis...`
    );

    // 1) Run AI analysis with OpenAI
    let metrics;
    try {
      console.log(`[${sessionId}] Calling analyzeInterviewWithOpenAI...`);
      metrics = await analyzeInterviewWithOpenAI({
        transcript:
          transcript && transcript.trim()
            ? transcript
            : "No transcript provided",
        eyeContactPercent:
          typeof eyeContactPercent === "number" ? eyeContactPercent : 0,
        wordCount: extraStats?.totalWords || 0,
        durationSec: calculateDuration(startedAt, endedAt),
        extraStats: extraStats || {},
      });

      console.log(`[${sessionId}] AI analysis complete:`, {
        appearanceScore: metrics.appearanceScore,
        languageGrammarScore: metrics.languageGrammarScore,
        confidenceScore: metrics.confidenceScore,
        contentDeliveryScore: metrics.contentDeliveryScore,
        knowledgeScore: metrics.knowledgeScore,
      });
    } catch (aiErr) {
      console.error(
        `[${sessionId}] AI analysis failed (${aiErr.message}) – using fallback metrics`
      );
      // Fallback metrics
      metrics = getDefaultMetrics();
    }

    // 2) Validate and extract scores
    const appearance = clampScore(metrics.appearanceScore ?? 0);
    const language = clampScore(metrics.languageGrammarScore ?? 0);
    const confidence = clampScore(metrics.confidenceScore ?? 0);
    const contentDelivery = clampScore(metrics.contentDeliveryScore ?? 0);
    const knowledge = clampScore(metrics.knowledgeScore ?? 0);

    const scores = [appearance, language, confidence, contentDelivery, knowledge];
    const validScores = scores.filter(
      (s) => typeof s === "number" && s >= 0 && s <= 100
    );
    const overallScore = validScores.length
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    console.log(`[${sessionId}] Scores calculated:`, {
      appearance,
      language,
      confidence,
      contentDelivery,
      knowledge,
      overallScore,
    });

    // 3) Calculate duration
    const durationSec = calculateDuration(startedAt, endedAt);

    // 4) Extract sentiment and tone
    const sentimentScore = clampScore(metrics.sentimentScore ?? 50);
    const sentiment = getSentimentSummary(metrics.sentiment || "neutral");
    const emotionalTone = metrics.emotionalTone || sentiment;

    // 5) Extract eye contact
    const eyeContactScore = clampScore(
      metrics.eyeContactPercent ?? eyeContactPercent ?? 0
    );
    const eyeContactLabel = getEyeContactLabel(eyeContactScore);

    // 6) Extract filler words and speech metrics
    const totalFillers =
      metrics.fillerCount ?? metrics.pauses?.estimatedPauses ?? 0;
    const wordCount = metrics.wordCount ?? extraStats?.totalWords ?? 0;
    const wpm = calculateWPM(wordCount, durationSec);
    const speakingPace = getSpeakingPaceLabel(wpm);
    const fillerUsage = getFillerUsageLabel(totalFillers);

    console.log(`[${sessionId}] All metrics processed:`, {
      eyeContactScore,
      wpm,
      totalFillers,
      durationSec,
    });

    // 7) Create attempt document (what dashboard / results will read)
    const attemptDoc = {
      userId,
      interviewId,
      createdAt: new Date().toISOString(),
      videoUrl,
      transcript: transcript && transcript.trim() ? transcript : "",
      durationSec,

      // Core scores (5 parameters)
      appearance,
      language,
      confidence,
      contentDelivery,
      knowledge,
      overallScore,

      // Insights for dashboard
      sentimentScore,
      sentimentSummary: sentiment,
      eyeContactPercent: eyeContactScore,
      eyeContactLabel,
      emotionalTone,
      wordCount,
      wpm,
      fillerCount: totalFillers,
      speakingPace,
      fillerUsage,

      // Additional AI insights
      aggregatedInsights: {
        averageWPM: wpm,
        totalFillers,
        sentimentTrend: metrics.sentiment || "neutral",
        confidenceLevel: confidence,
      },

      // Status
      status: "completed",
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };

    console.log(`[${sessionId}] Saving attempt to Firestore...`);

    // 8) Save attempt to mockInterviewAttempts collection
    const attemptRef = await db
      .collection("mockInterviewAttempts")
      .add(attemptDoc);

    console.log(`[${sessionId}] Attempt saved with ID: ${attemptRef.id}`);

    // 9) Update the main interview session doc
    const sessionPayload = {
      userId,
      videoUrl,
      transcript: transcript && transcript.trim() ? transcript : "",
      metrics,
      startedAt: startedAt || null,
      endedAt: endedAt || null,
      status: "completed",
      updatedAt: new Date().toISOString(),
      latestAttemptId: attemptRef.id,
      overallScore,
    };

    await db.collection("mockInterviews").doc(interviewId).set(sessionPayload, {
      merge: true,
    });

    console.log(
      `[${sessionId}] Interview session updated: ${interviewId}`
    );

    const processingTime = Date.now() - startTime;
    console.log(
      `[${sessionId}] Interview processed successfully in ${processingTime}ms`
    );

    return res.status(200).json({
      success: true,
      interviewId,
      attemptId: attemptRef.id,
      overallScore,
      scores: {
        appearance,
        language,
        confidence,
        contentDelivery,
        knowledge,
      },
      insights: {
        eyeContactScore,
        wpm,
        totalFillers,
        sentimentScore,
      },
      processingTimeMs: processingTime,
    });
  } catch (error) {
    console.error(
      `[${sessionId}] Error submitting AI interview:`,
      error
    );
    return res.status(500).json({
      error: error.message || "Failed to process interview",
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

/** Helper: Calculate duration in seconds */
function calculateDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) return 0;

  try {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    const diffMs = end.getTime() - start.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) return 0;
    return Math.round(diffMs / 1000);
  } catch (err) {
    console.error("Error calculating duration:", err);
    return 0;
  }
}

/** Helper: Clamp score to 0-100 */
function clampScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

/** Helper: Calculate WPM (Words Per Minute) */
function calculateWPM(wordCount, durationSec) {
  if (!durationSec || durationSec <= 0 || !wordCount) return 0;

  const minutes = Math.max(1, durationSec / 60);
  return Math.round(wordCount / minutes);
}

/** Helper: Get sentiment summary label */
function getSentimentSummary(sentiment) {
  if (sentiment === "positive") {
    return "Overall positive and confident emotional tone.";
  } else if (sentiment === "negative") {
    return "Overall negative or highly nervous emotional tone.";
  } else if (sentiment === "neutral") {
    return "Overall neutral emotional tone.";
  }
  return "Emotional tone: neutral to positive.";
}

/** Helper: Get speaking pace label */
function getSpeakingPaceLabel(wpm) {
  if (wpm > 160) return "fast";
  if (wpm < 90) return "slow";
  return "normal";
}

/** Helper: Get filler usage label */
function getFillerUsageLabel(fillerCount) {
  if (fillerCount > 15) return "high";
  if (fillerCount > 8) return "medium";
  return "low";
}

/** Helper: Get eye contact label */
function getEyeContactLabel(score) {
  if (score > 70) return "stable";
  if (score > 40) return "variable";
  return "weak";
}

/** Helper: Default metrics if AI analysis fails */
function getDefaultMetrics() {
  return {
    appearanceScore: 75,
    languageGrammarScore: 75,
    confidenceScore: 70,
    contentDeliveryScore: 72,
    knowledgeScore: 70,
    sentimentScore: 60,
    sentiment: "neutral",
    eyeContactPercent: 50,
    emotionalTone: "Neutral emotional tone.",
    wordCount: 0,
    fillerCount: 5,
    pauses: { estimatedPauses: 5 },
  };
}
