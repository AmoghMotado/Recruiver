// server/routes/interview.js
const express = require("express");
const multer = require("multer");
const { requireAuth, requireRole } = require("../middleware/auth");
const { db, storage } = require("../lib/firebaseAdmin");

const router = express.Router();

// In-memory upload for video
const upload = multer({ storage: multer.memoryStorage() });

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "object") {
    if (typeof value.toDate === "function") return value.toDate();
    const sec = value.seconds ?? value._seconds;
    if (typeof sec === "number") return new Date(sec * 1000);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Load job + its video interview questions.
 * Sources:
 *  1) Subcollection: jobs/{jobId}/videoInterviewQuestions
 *  2) Fallback: job.videoInterviewQuestionsInline (array on job doc)
 */
async function loadVideoConfigForJob(jobId) {
  const jobRef = db.collection("jobs").doc(jobId);
  const jobSnap = await jobRef.get();

  if (!jobSnap.exists) {
    const err = new Error("Job not found");
    err.status = 404;
    throw err;
  }

  const job = { id: jobSnap.id, ...jobSnap.data() };

  // --- 1) Try subcollection first ---
  const qsSnap = await jobRef.collection("videoInterviewQuestions").get();
  let questions = qsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((q, idx) => ({
      id: q.id || `q${idx + 1}`,
      text: q.text || "",
      category: q.category || "general",
      suggestedDurationSec:
        typeof q.suggestedDurationSec === "number"
          ? q.suggestedDurationSec
          : 90,
    }));

  // --- 2) If subcollection is empty, fall back to inline array on job doc ---
  if (!questions.length && Array.isArray(job.videoInterviewQuestionsInline)) {
    questions = job.videoInterviewQuestionsInline.map((q, idx) => ({
      id: q.id || `q${idx + 1}`,
      text: q.text || q.question || "",
      category: q.category || "general",
      suggestedDurationSec:
        typeof q.suggestedDurationSec === "number"
          ? q.suggestedDurationSec
          : typeof q.durationSec === "number"
          ? q.durationSec
          : 90,
    }));
  }

  console.log(
    "[VideoInterviewConfig] loadVideoConfigForJob",
    jobId,
    "questions:",
    questions.length
  );

  return { job, questions };
}

/**
 * Extremely simple “analysis” placeholder.
 * You can replace this with real OpenAI-based analysis later.
 */
function simpleAnalyzeInterview({ questions, answersMeta }) {
  const totalQuestions = questions.length;
  const answers =
    Array.isArray(answersMeta) && answersMeta.length
      ? answersMeta
      : questions.map((q) => ({
          questionId: q.id,
          questionText: q.text,
          transcript: "",
        }));

  const perAnswer = answers.map((a) => {
    const wordCount = (a.transcript || "")
      .split(/\s+/)
      .filter(Boolean).length;
    const score =
      wordCount === 0
        ? 40
        : Math.max(50, Math.min(100, 50 + wordCount)); // dumb heuristic

    return {
      ...a,
      wordCount,
      score,
      sentiment: "NEUTRAL",
      tags: [],
    };
  });

  const overallScore =
    perAnswer.reduce((sum, a) => sum + (a.score || 0), 0) /
    (perAnswer.length || 1);

  return {
    totalQuestions,
    overallScore: Math.round(overallScore),
    answers: perAnswer,
    strengths: [],
    improvements: [],
    violations: [],
  };
}

/* -------------------------------------------------------
   RECRUITER – load & save per-job configuration
   Used by /recruiter/video-interview/[jobId]/editor
------------------------------------------------------- */

/**
 * GET /api/interview/job/:jobId
 * Load video interview config for a job.
 */
router.get(
  "/job/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const jobRef = db.collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = { id: jobSnap.id, ...jobSnap.data() };

      const { questions } = await loadVideoConfigForJob(jobId);

      const config =
        questions.length || job.videoInterviewDurationMinutes
          ? {
              durationMinutes: job.videoInterviewDurationMinutes || 15,
              questions,
            }
          : null;

      res.json({ job, config });
    } catch (err) {
      console.error("Error loading video interview config:", err);
      const code = err.status || 500;
      res.status(code).json({
        message: code === 404 ? err.message : "Failed to load config",
      });
    }
  }
);

/**
 * PUT /api/interview/job/:jobId
 * Save video interview config for a job.
 * Body: { durationMinutes, questions[] }
 */
router.put(
  "/job/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { durationMinutes, questions } = req.body || {};

      if (!durationMinutes || !Array.isArray(questions)) {
        return res.status(400).json({
          message: "durationMinutes and questions[] are required",
        });
      }
      if (!questions.length) {
        return res
          .status(400)
          .json({ message: "At least one interview question is required" });
      }

      questions.forEach((q, idx) => {
        if (!q.text && !q.question) {
          throw Object.assign(
            new Error(`Question ${idx + 1} is missing text`),
            { status: 400 }
          );
        }
      });

      const jobRef = db.collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not your job posting" });
      }

      const now = new Date();

      // Normalized inline questions to also store on the job doc
      const inlineQuestions = questions.map((q, idx) => ({
        id: q.id || `q${idx + 1}`,
        text: q.text || q.question || "",
        category: q.category || "general",
        suggestedDurationSec:
          typeof q.suggestedDurationSec === "number"
            ? q.suggestedDurationSec
            : typeof q.durationSec === "number"
            ? q.durationSec
            : 90,
        order: idx,
      }));

      // Store flags + inline array on job doc
      await jobRef.set(
        {
          hasVideoInterview: true,
          videoInterviewDurationMinutes: Number(durationMinutes),
          videoInterviewQuestionsInline: inlineQuestions,
          updatedAt: now,
        },
        { merge: true }
      );

      // Replace questions subcollection completely
      const qsCol = jobRef.collection("videoInterviewQuestions");
      const existing = await qsCol.get();
      const batch = db.batch();
      existing.forEach((doc) => batch.delete(doc.ref));

      inlineQuestions.forEach((q) => {
        const ref = qsCol.doc(q.id);
        batch.set(ref, {
          text: q.text,
          category: q.category,
          suggestedDurationSec: q.suggestedDurationSec,
          order: q.order,
          updatedAt: now,
        });
      });

      await batch.commit();

      console.log(
        "[VideoInterviewConfig] Saved",
        inlineQuestions.length,
        "questions for job",
        jobId
      );

      res.json({
        message: "Video interview config saved",
        config: {
          durationMinutes: Number(durationMinutes),
          questions: inlineQuestions,
        },
      });
    } catch (err) {
      console.error("Error saving video interview config:", err);
      const code = err.status || 500;
      res.status(code).json({
        message:
          code === 400 ? err.message : "Failed to save video interview config",
      });
    }
  }
);

/* -------------------------------------------------------
   CANDIDATE – load questions for an application
   Used by /candidate/video-interview/start
------------------------------------------------------- */

/**
 * GET /api/interview/test?applicationId=...
 */
router.get(
  "/test",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const { applicationId } = req.query;
      if (!applicationId) {
        return res
          .status(400)
          .json({ message: "applicationId query param required" });
      }

      const appRef = db.collection("applications").doc(String(applicationId));
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      // Make sure this is the logged-in candidate
      if (app.studentId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this interview" });
      }

      // Optional: guard by stage/status (pipeline)
      const stage = typeof app.stage === "number" ? app.stage : 0;
      if (stage < 2 || app.status !== "SHORTLISTED") {
        return res.status(400).json({
          message:
            "You have not been invited to the AI video interview yet. Please wait for the recruiter.",
        });
      }

      const { job, questions } = await loadVideoConfigForJob(app.jobId);

      console.log(
        "[VideoInterviewTest] Application",
        applicationId,
        "job",
        app.jobId,
        "questions found:",
        questions.length
      );

      if (!questions.length) {
        return res.status(400).json({
          message:
            "Video interview is not configured yet for this job. Please wait for recruiter configuration.",
        });
      }

      res.json({
        questions,
        meta: {
          jobId: app.jobId,
          title: job.title || "",
          company: job.company || "",
          durationMinutes: job.videoInterviewDurationMinutes || 15,
        },
      });
    } catch (err) {
      console.error("Error loading interview test:", err);
      const code = err.status || 500;
      res.status(code).json({
        message:
          code === 500
            ? "Failed to load video interview details"
            : err.message || "Failed to load video interview details",
      });
    }
  }
);

/* -------------------------------------------------------
   CANDIDATE – upload video + store summary
------------------------------------------------------- */

/**
 * POST /api/interview/:applicationId/upload
 * FormData: { video: File, answersJson?: string }
 */
router.post(
  "/:applicationId/upload",
  requireAuth,
  requireRole("CANDIDATE"),
  upload.single("video"),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      if (!applicationId) {
        return res.status(400).json({ message: "applicationId required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      const appRef = db.collection("applications").doc(String(applicationId));
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      if (app.studentId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to submit this interview" });
      }

      const { questions } = await loadVideoConfigForJob(app.jobId);

      // Upload to Firebase Storage
      const bucket = storage.bucket();
      if (!bucket) {
        throw new Error(
          "Firebase Storage bucket is not configured. Check storageBucket in firebaseAdmin.js / env."
        );
      }

      const fileName = `video-interviews/${applicationId}/${Date.now()}.webm`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype || "video/webm",
        resumable: false,
      });

      let answersMeta = [];
      if (typeof req.body.answersJson === "string") {
        try {
          answersMeta = JSON.parse(req.body.answersJson);
        } catch (e) {
          answersMeta = [];
        }
      }

      // TODO: plug your real OpenAI-based analysis here.
      const analysis = simpleAnalyzeInterview({ questions, answersMeta });

      const now = new Date();

      await appRef.set(
        {
          videoInterviewScore: analysis.overallScore,
          videoInterviewSummary: {
            ...analysis,
            videoStoragePath: fileName,
            submittedAt: now,
          },
          // Stage 2 is the video interview stage – keep at least 2
          stage: Math.max(typeof app.stage === "number" ? app.stage : 0, 2),
          status: "UNDER_REVIEW",
          updatedAt: now,
        },
        { merge: true }
      );

      console.log(
        "[VideoInterviewUpload] Saved video for application",
        applicationId,
        "score:",
        analysis.overallScore
      );

      res.json({
        message: "Interview uploaded and analyzed",
        score: analysis.overallScore,
        summary: analysis,
      });
    } catch (err) {
      console.error("Error handling interview upload:", err);
      res.status(500).json({
        message: "Failed to upload or analyze interview",
      });
    }
  }
);

module.exports = router;
