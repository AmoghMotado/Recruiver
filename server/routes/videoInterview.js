// server/routes/videoInterview.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

/* =========================================================
   Helpers
   ========================================================= */

function cleanQuestions(raw = []) {
  const out = [];
  raw.forEach((q, idx) => {
    if (!q) return;
    const text = (q.text || "").trim();
    if (!text) return;
    const suggestedDuration = Number(q.suggestedDuration) || 90;
    const focus = (q.focus || "").trim();
    out.push({
      id: q.id || String(idx + 1),
      text,
      suggestedDuration,
      focus,
    });
  });
  return out;
}

/* =========================================================
   RECRUITER – CONFIG FOR A JOB
   ========================================================= */

/**
 * GET /api/video-interview/config/:jobId
 */
router.get(
  "/config/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const jobRef = db.collection("jobs").doc(jobId);
      const cfgRef = db.collection("videoInterviewConfigs").doc(jobId);

      const [jobSnap, cfgSnap] = await Promise.all([
        jobRef.get(),
        cfgRef.get(),
      ]);

      const jobData = jobSnap.exists ? jobSnap.data() : null;
      const cfgData = cfgSnap.exists ? cfgSnap.data() : null;

      const ownerId =
        (jobData && jobData.recruiterId) ||
        (cfgData && cfgData.recruiterId) ||
        null;

      if (ownerId && ownerId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job" });
      }

      const job = jobData
        ? {
            id: jobSnap.id,
            title: jobData.title,
            companyName: jobData.company || jobData.companyName || "",
          }
        : null;

      const config = cfgData
        ? {
            jobId,
            intro:
              cfgData.intro ||
              "Welcome to the AI video interview. Please answer each question clearly and confidently.",
            outro:
              cfgData.outro ||
              "Thank you for completing the interview. Our team will review your responses and get back to you soon.",
            questions: Array.isArray(cfgData.questions)
              ? cfgData.questions
              : [],
          }
        : null;

      return res.json({ job, config });
    } catch (err) {
      console.error("GET /video-interview/config/:jobId error:", err);
      return res.status(500).json({ message: "Failed to load config" });
    }
  }
);

/**
 * PUT /api/video-interview/config/:jobId
 */
router.put(
  "/config/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { intro, outro, questions = [] } = req.body || {};

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job" });
      }

      const cleanedQuestions = cleanQuestions(questions);
      if (!cleanedQuestions.length) {
        return res
          .status(400)
          .json({ message: "Please add at least one question" });
      }

      const payload = {
        jobId,
        recruiterId: job.recruiterId,
        intro:
          (intro || "").trim() ||
          "Welcome to the AI video interview. Please answer each question clearly and confidently.",
        outro:
          (outro || "").trim() ||
          "Thank you for completing the interview. Our team will review your responses and get back to you soon.",
        questions: cleanedQuestions,
        updatedAt: new Date(),
      };

      await db.collection("videoInterviewConfigs").doc(jobId).set(payload, {
        merge: true,
      });

      return res.json({ message: "Config saved", config: payload });
    } catch (err) {
      console.error("PUT /video-interview/config/:jobId error:", err);
      return res.status(500).json({ message: "Failed to save config" });
    }
  }
);

/* =========================================================
   CANDIDATE – LOAD CONFIG FOR APPLICATION
   ========================================================= */

/**
 * GET /api/video-interview/session?applicationId=...
 */
router.get(
  "/session",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const { applicationId } = req.query;
      if (!applicationId) {
        return res
          .status(400)
          .json({ message: "applicationId query param is required" });
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
          .json({ message: "You are not allowed to access this interview" });
      }

      // Only after recruiter shortlists to Round 2
      if ((app.stage || 0) < 2 || app.status !== "SHORTLISTED") {
        return res.status(403).json({
          message:
            "You have not been invited to the AI video interview for this job yet.",
        });
      }

      const jobId = app.jobId;
      if (!jobId) {
        return res
          .status(400)
          .json({ message: "Application does not have a jobId" });
      }

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();

      const cfgSnap = await db
        .collection("videoInterviewConfigs")
        .doc(jobId)
        .get();
      if (!cfgSnap.exists) {
        return res.status(404).json({
          message:
            "AI video interview questions have not been configured yet for this job.",
        });
      }
      const cfg = cfgSnap.data();
      const questions = Array.isArray(cfg.questions) ? cfg.questions : [];

      if (!questions.length) {
        return res.status(400).json({
          message:
            "This job's AI video interview has no questions configured. Please contact the recruiter.",
        });
      }

      const totalSeconds = questions.reduce(
        (sum, q) => sum + (Number(q.suggestedDuration) || 90),
        0
      );
      const durationMinutes = Math.max(1, Math.ceil(totalSeconds / 60));

      const meta = {
        applicationId,
        jobId,
        title: job.title || "",
        company: job.company || job.companyName || "",
        totalQuestions: questions.length,
        durationMinutes,
      };

      return res.json({
        success: true,
        meta,
        intro: cfg.intro || "",
        outro: cfg.outro || "",
        questions,
      });
    } catch (err) {
      console.error("GET /video-interview/session error:", err);
      return res
        .status(500)
        .json({ message: "Failed to load video interview session" });
    }
  }
);

module.exports = router;
