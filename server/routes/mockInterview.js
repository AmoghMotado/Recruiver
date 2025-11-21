// server/routes/mockInterview.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { requireAuth } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

// ---------- Video upload setup ----------
const uploadDir = path.join(process.cwd(), "uploads", "mock-interviews");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".webm", ".mp4", ".mov"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// ---------- AI analysis (stub) ----------

/**
 * POST /api/mock-interview/analyze
 * Analyze a single video answer using AI
 */
router.post(
  "/analyze",
  requireAuth,
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video uploaded" });
      }

      const { question, transcript } = req.body;

      // Simulated AI analysis (replace with real API later)
      const scores = await analyzeWithAI(
        question,
        transcript,
        req.file.path
      );

      return res.json({ scores });
    } catch (err) {
      console.error("POST /api/mock-interview/analyze error:", err);
      return res.status(500).json({ message: "Failed to analyze video" });
    }
  }
);

/**
 * AI Analysis Function (Replace with real Claude / OpenAI / other API later)
 */
async function analyzeWithAI(question, transcript, videoPath) {
  const wordCount = transcript ? transcript.split(" ").length : 0;

  const baseScore = 70;
  const lengthBonus = Math.min(15, Math.floor(wordCount / 10));

  return {
    appearance: baseScore + Math.floor(Math.random() * 10) + 5,
    language: baseScore + lengthBonus + Math.floor(Math.random() * 10),
    confidence: baseScore + Math.floor(Math.random() * 15),
    contentDelivery:
      baseScore + lengthBonus + Math.floor(Math.random() * 10),
    knowledge: baseScore + Math.floor(Math.random() * 10),
  };
}

// ---------- Summary / attempts (Firestore) ----------

/**
 * GET /api/mock-interview/summary
 * Aggregated summary for current user
 */
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const snap = await db
      .collection("mockInterviewAttempts")
      .where("userId", "==", userId)
      .orderBy("takenAt", "desc")
      .limit(50)
      .get();

    if (snap.empty) {
      return res.json({
        totalAttempts: 0,
        averageScore: 0,
        top10Average: 0,
        improvementRate: 0,
        latestScore: null,
        latest: null,
        skills: {
          appearance: 0,
          language: 0,
          confidence: 0,
          contentDelivery: 0,
          knowledge: 0,
        },
      });
    }

    const attempts = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const totalAttempts = attempts.length;
    const scores = attempts.map((a) => Number(a.score || a.overallScore || 0));
    const averageScore =
      scores.reduce((sum, s) => sum + s, 0) / Math.max(1, scores.length);

    const top10 = attempts.slice(0, 10);
    const top10Avg =
      top10.reduce(
        (sum, a) => sum + Number(a.score || a.overallScore || 0),
        0
      ) / Math.max(1, top10.length);

    const latest = attempts[0];
    const latestScore = Number(latest.score || latest.overallScore || 0);

    const oldest = attempts[attempts.length - 1];
    const oldestScore = Number(oldest.score || oldest.overallScore || 0);
    const improvementRate = latestScore - oldestScore;

    const skills = latest.details || latest.scores || {
      appearance: 0,
      language: 0,
      confidence: 0,
      contentDelivery: 0,
      knowledge: 0,
    };

    return res.json({
      totalAttempts,
      averageScore,
      top10Average: top10Avg,
      improvementRate,
      latestScore,
      latest,
      skills,
    });
  } catch (err) {
    console.error("GET /api/mock-interview/summary error:", err);
    return res.status(500).json({ message: "Failed to load summary" });
  }
});

/**
 * GET /api/mock-interview/attempts
 * Returns latest attempts for the user
 */
router.get("/attempts", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const snap = await db
      .collection("mockInterviewAttempts")
      .where("userId", "==", userId)
      .orderBy("takenAt", "desc")
      .limit(50)
      .get();

    const attempts = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return res.json({ attempts });
  } catch (err) {
    console.error("GET /api/mock-interview/attempts error:", err);
    return res.status(500).json({ message: "Failed to load attempts" });
  }
});

/**
 * POST /api/mock-interview/attempts
 * body: { appearance, language, confidence, contentDelivery, knowledge, jobId? }
 * Persists a mock interview attempt
 */
router.post("/attempts", requireAuth, async (req, res) => {
  try {
    const {
      appearance = 0,
      language = 0,
      confidence = 0,
      contentDelivery = 0,
      knowledge = 0,
      jobId,
    } = req.body || {};

    const numeric = {
      appearance: Number(appearance),
      language: Number(language),
      confidence: Number(confidence),
      contentDelivery: Number(contentDelivery),
      knowledge: Number(knowledge),
    };

    const avg =
      (numeric.appearance +
        numeric.language +
        numeric.confidence +
        numeric.contentDelivery +
        numeric.knowledge) / 5;

    const score = Math.round(avg);
    const now = new Date();

    const docRef = await db.collection("mockInterviewAttempts").add({
      userId: req.user.id,
      jobId: jobId || null,
      score,
      details: numeric,
      takenAt: now,
    });

    // Optional: attach to applications if jobId provided
    if (jobId) {
      const appsRef = db.collection("applications");
      const existingSnap = await appsRef
        .where("jobId", "==", jobId)
        .where("studentId", "==", req.user.id)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        const appRef = existingSnap.docs[0].ref;
        await appRef.set(
          {
            interviewScore: score,
            status: "ROUND3_DONE",
            updatedAt: now,
          },
          { merge: true }
        );
      }
    }

    const attempt = {
      id: docRef.id,
      userId: req.user.id,
      score,
      details: numeric,
      takenAt: now,
      jobId: jobId || null,
    };

    return res.status(201).json({ attempt });
  } catch (err) {
    console.error("POST /api/mock-interview/attempts error:", err);
    return res.status(500).json({ message: "Failed to save attempt" });
  }
});

module.exports = router;
