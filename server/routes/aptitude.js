// server/routes/aptitude.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

/* =========================================================
   Helpers
   ========================================================= */

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

function sanitizeQuestionForCandidate(q, index) {
  return {
    id: q.id || String(index),
    index,
    text: q.text || "",
    options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
  };
}

/* Small helper to normalise questions coming from editor/config */
function cleanQuestions(rawQuestions = []) {
  const cleaned = [];

  rawQuestions.forEach((q, idx) => {
    if (!q || !q.text || !Array.isArray(q.options)) return;

    const opts = q.options
      .map((o) => String(o || "").trim())
      .filter(Boolean)
      .slice(0, 4);

    if (!opts.length) return;

    let correctIndex = Number(q.correctIndex);
    if (
      Number.isNaN(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= opts.length
    ) {
      correctIndex = 0; // default to first option
    }

    cleaned.push({
      id: q.id || String(idx),
      text: q.text,
      options: opts,
      correctIndex,
    });
  });

  return cleaned;
}

/* =========================================================
   Recruiter: Configure aptitude test for a job
   (Primary config endpoints)
   ========================================================= */

/**
 * GET /api/aptitude/config/:jobId
 * Fetch current aptitude config for a job (generic shape).
 */
router.get(
  "/config/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const jobRef = db.collection("jobs").doc(jobId);
      const cfgRef = db.collection("aptitudeTests").doc(jobId);

      const [jobSnap, cfgSnap] = await Promise.all([
        jobRef.get(),
        cfgRef.get(),
      ]);

      const job = jobSnap.exists ? jobSnap.data() : null;
      const cfg = cfgSnap.exists ? cfgSnap.data() : null;

      // Determine owner of this config
      const ownerId =
        (job && job.recruiterId) || (cfg && cfg.recruiterId) || null;

      if (ownerId && ownerId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job's test" });
      }

      if (!cfgSnap.exists) {
        // default empty config
        return res.json({
          jobId,
          durationMinutes: 60,
          questions: [],
        });
      }

      return res.json({
        jobId,
        durationMinutes: Number(cfg.durationMinutes) || 60,
        questions: Array.isArray(cfg.questions) ? cfg.questions : [],
      });
    } catch (err) {
      console.error("GET /aptitude/config/:jobId error:", err);
      return res
        .status(500)
        .json({ message: "Failed to load aptitude config" });
    }
  }
);

/**
 * POST /api/aptitude/config/:jobId
 * Save aptitude config for a job.
 * Body: { durationMinutes, questions: [{ text, options[4], correctIndex }] }
 */
router.post(
  "/config/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { durationMinutes = 60, questions = [] } = req.body || {};

      // verify job ownership
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job's test" });
      }

      const duration = Number(durationMinutes) || 60;
      const cleanedQuestions = cleanQuestions(questions);

      const payload = {
        jobId,
        recruiterId: job.recruiterId,
        durationMinutes: duration,
        questions: cleanedQuestions,
        updatedAt: new Date(),
      };

      await db.collection("aptitudeTests").doc(jobId).set(payload, {
        merge: true,
      });

      return res.json({
        message: "Aptitude test saved",
        config: payload,
      });
    } catch (err) {
      console.error("POST /aptitude/config/:jobId error:", err);
      return res
        .status(500)
        .json({ message: "Failed to save aptitude config" });
    }
  }
);

/* =========================================================
   Recruiter: Legacy endpoints used by Next.js editor
   (/api/aptitude/job/:jobId)
   ========================================================= */

/**
 * GET /api/aptitude/job/:jobId
 * Shape expected by pages/recruiter/aptitude/[jobId].js:
 * { job, test }
 */
router.get(
  "/job/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const jobRef = db.collection("jobs").doc(jobId);
      const cfgRef = db.collection("aptitudeTests").doc(jobId);

      const [jobSnap, cfgSnap] = await Promise.all([
        jobRef.get(),
        cfgRef.get(),
      ]);

      const jobData = jobSnap.exists ? jobSnap.data() : null;
      const cfg = cfgSnap.exists ? cfgSnap.data() : null;

      const ownerId =
        (jobData && jobData.recruiterId) ||
        (cfg && cfg.recruiterId) ||
        null;

      if (ownerId && ownerId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job's test" });
      }

      const job =
        jobData && jobSnap.exists
          ? { id: jobSnap.id, ...jobData }
          : null;

      const test = cfgSnap.exists
        ? {
            jobId,
            durationMinutes: Number(cfg.durationMinutes) || 60,
            questions: Array.isArray(cfg.questions) ? cfg.questions : [],
          }
        : null;

      return res.json({
        job,
        test,
      });
    } catch (err) {
      console.error("GET /aptitude/job/:jobId error:", err);
      return res
        .status(500)
        .json({ message: "Failed to load aptitude config" });
    }
  }
);

/**
 * PUT /api/aptitude/job/:jobId
 * Body from editor: { durationMinutes, questions }
 * Writes into aptitudeTests/{jobId} – same doc the candidate test uses.
 */
router.put(
  "/job/:jobId",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const { durationMinutes = 60, questions = [] } = req.body || {};

      // verify job ownership
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to edit this job's test" });
      }

      const duration = Number(durationMinutes) || 60;
      const cleanedQuestions = cleanQuestions(questions);

      if (!cleanedQuestions.length) {
        return res.status(400).json({
          message: "Please add at least one valid question before saving",
        });
      }

      const payload = {
        jobId,
        recruiterId: job.recruiterId,
        durationMinutes: duration,
        questions: cleanedQuestions,
        updatedAt: new Date(),
      };

      await db.collection("aptitudeTests").doc(jobId).set(payload, {
        merge: true,
      });

      return res.json({
        success: true,
        message: "Aptitude test saved",
        test: payload,
      });
    } catch (err) {
      console.error("PUT /aptitude/job/:jobId error:", err);
      return res
        .status(500)
        .json({ message: "Failed to save aptitude test" });
    }
  }
);

/* =========================================================
   Candidate: Load test for a specific application / job
   ========================================================= */

/**
 * GET /api/aptitude/test?applicationId=...
 * Returns the live aptitude test configured for the job
 * linked to that application.
 *
 * NO dummy / static questions – always the recruiter’s config.
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
          .json({ message: "applicationId query param is required" });
      }

      // 1) Load application
      const appSnap = await db
        .collection("applications")
        .doc(String(applicationId))
        .get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      // security: make sure this is the logged-in candidate
      if (app.studentId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this test" });
      }

      // 2) Load job
      const jobId = app.jobId;
      if (!jobId) {
        return res
          .status(400)
          .json({ message: "Application is missing associated job" });
      }

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();

      // 3) Load aptitude config for this job
      const cfgSnap = await db.collection("aptitudeTests").doc(jobId).get();
      if (!cfgSnap.exists) {
        return res.status(404).json({
          message:
            "Aptitude test has not been configured yet for this job. Please contact the recruiter.",
        });
      }

      const cfg = cfgSnap.data();
      const durationMinutes = Number(cfg.durationMinutes) || 60;
      const questionsArray = Array.isArray(cfg.questions) ? cfg.questions : [];

      if (!questionsArray.length) {
        return res.status(400).json({
          message:
            "This job's aptitude test has no questions configured. Please contact the recruiter.",
        });
      }

      // 4) Build response – NEVER expose correctIndex to the client
      const questions = questionsArray.map((q, idx) =>
        sanitizeQuestionForCandidate(q, idx + 1)
      );

      const meta = {
        applicationId,
        jobId,
        title: job.title || "Aptitude Test",
        company: job.company || "",
        durationMinutes,
        totalQuestions: questions.length,
      };

      return res.json({
        success: true,
        meta,
        questions,
      });
    } catch (err) {
      console.error("GET /aptitude/test error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load aptitude test",
      });
    }
  }
);

/* =========================================================
   Candidate: Submit aptitude test
   ========================================================= */

/**
 * POST /api/aptitude/submit
 * Body (new pipeline):
 * {
 *   applicationId,
 *   answers: [{ questionId, optionIndex }] OR { [questionId]: optionIndex },
 *   proctoring?: { totalViolations, autoSubmitted, ... },
 *   endReason?: "TIME_UP" | "VIOLATION_LIMIT" | "MANUAL"
 * }
 *
 * Also backwards-compatible with the old payload:
 * { applicationId, score, summary }
 */
router.post(
  "/submit",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const {
        applicationId,
        answers,
        proctoring = {},
        score,
        summary,
        endReason,
      } = req.body || {};

      if (!applicationId) {
        return res.status(400).json({ message: "applicationId is required" });
      }

      // 1) Load application
      const appRef = db.collection("applications").doc(String(applicationId));
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      if (app.studentId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to submit this test" });
      }

      // 2) Load job & aptitude config
      const jobId = app.jobId;
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();

      const cfgSnap = await db.collection("aptitudeTests").doc(jobId).get();
      if (!cfgSnap.exists) {
        return res.status(404).json({
          message:
            "Aptitude test configuration missing for this job. Please contact support.",
        });
      }
      const cfg = cfgSnap.data();
      const questionsArray = Array.isArray(cfg.questions) ? cfg.questions : [];

      if (!questionsArray.length) {
        return res
          .status(400)
          .json({ message: "This test has no configured questions" });
      }

      let finalScore = 0;
      let serverSummary = null;

      /* ---------- Preferred: compute score from answers ---------- */
      if (
        (Array.isArray(answers) && answers.length) ||
        (answers && typeof answers === "object")
      ) {
        const answersById = {};

        if (Array.isArray(answers)) {
          answers.forEach((a) => {
            if (!a) return;
            const qid = String(a.questionId);
            if (qid && typeof a.optionIndex === "number") {
              answersById[qid] = Number(a.optionIndex);
            }
          });
        } else if (answers && typeof answers === "object") {
          Object.keys(answers).forEach((k) => {
            answersById[String(k)] = Number(answers[k]);
          });
        }

        let correct = 0;
        let attempted = 0;

        questionsArray.forEach((q) => {
          const qId = String(q.id || "");
          if (
            Object.prototype.hasOwnProperty.call(answersById, qId) &&
            typeof answersById[qId] === "number"
          ) {
            attempted += 1;
            if (answersById[qId] === Number(q.correctIndex)) {
              correct += 1;
            }
          }
        });

        const totalQuestions = questionsArray.length;
        const incorrect = attempted - correct;
        finalScore =
          totalQuestions > 0
            ? Math.round((correct / totalQuestions) * 100)
            : 0;

        serverSummary = {
          totalQuestions,
          correct,
          incorrect,
          attempted,
          skipped: totalQuestions - attempted,
          score: finalScore,
          proctoring: {
            totalViolations: Number(proctoring.totalViolations) || 0,
            autoSubmitted: !!proctoring.autoSubmitted,
            ...proctoring,
          },
          jobTitle: job.title || "",
          company: job.company || "",
          submittedAt: new Date(),
        };
      } else if (typeof score === "number") {
        // ---------- Backwards compatible path ----------
        finalScore = Number(score) || 0;
        const totalQuestions =
          (summary && (summary.totalQuestions || summary.total)) || 0;
        serverSummary = {
          ...(summary || {}),
          totalQuestions,
          score: finalScore,
          jobTitle: job.title || "",
          company: job.company || "",
          submittedAt: new Date(),
        };
      } else {
        return res.status(400).json({
          message: "Either answers or numeric score is required",
        });
      }

      // 4) Persist score on application
      const now = new Date();
      let nextStatus = app.status || "APPLIED";
      if (nextStatus === "SHORTLISTED") {
        // After candidate submits Round 1, recruiter reviews
        nextStatus = "UNDER_REVIEW";
      }

      await appRef.set(
        {
          score: finalScore,
          aptitudeSummary: serverSummary,
          status: nextStatus,
          // Round 1 done → move to at least stage 2 (review)
          stage:
            typeof app.stage === "number" ? Math.max(app.stage, 2) : 2,
          updatedAt: now,
        },
        { merge: true }
      );

      return res.json({
        success: true,
        message: "Aptitude test submitted",
        score: finalScore,
        summary: serverSummary,
        endReason: endReason || null,
      });
    } catch (err) {
      console.error("POST /aptitude/submit error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to submit aptitude test",
      });
    }
  }
);

module.exports = router;
