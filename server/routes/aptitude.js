// server/routes/aptitude.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

/**
 * GET /api/aptitude/test?applicationId=...
 * Candidate fetches Round-2 test questions for a given application.
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

      const appSnap = await db
        .collection("applications")
        .doc(applicationId)
        .get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      // Ensure this candidate owns the application
      if (app.studentId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to access this test." });
      }

      // Optionally validate stage/status here
      // e.g. SHORTLISTED & stage >= 2

      const jobSnap = await db.collection("jobs").doc(app.jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();

      // Fetch aptitude question bank for this job
      // Simplest: single shared collection per job: aptitudeQuestions
      const qsSnap = await db
        .collection("jobs")
        .doc(app.jobId)
        .collection("aptitudeQuestions")
        .get();

      if (qsSnap.empty) {
        return res.status(400).json({
          message:
            "Aptitude test is not configured yet for this job. Please contact the recruiter.",
        });
      }

      const questions = qsSnap.docs.map((d) => {
        const q = d.data();
        return {
          id: d.id,
          text: q.text,
          options: q.options || [],
          correct: q.correctIndex ?? 0,
          category: q.category || "general",
        };
      });

      return res.json({
        questions,
        meta: {
          jobId: app.jobId,
          title: job.title || "",
          company: job.company || "",
        },
      });
    } catch (err) {
      console.error("Error loading aptitude test:", err);
      return res
        .status(500)
        .json({ message: "Failed to load aptitude test" });
    }
  }
);

/**
 * POST /api/aptitude/submit
 * Body: { applicationId, score, summary }
 * summary = { total, correct, attempted, skipped, autoSubmitted, autoReason, byCategory, violations }
 */
router.post(
  "/submit",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const { applicationId, score, summary } = req.body || {};
      if (!applicationId || typeof score !== "number") {
        return res.status(400).json({
          message: "applicationId and numeric score are required",
        });
      }

      const appRef = db.collection("applications").doc(applicationId);
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      if (app.studentId !== req.user.id) {
        return res.status(403).json({
          message: "You are not allowed to submit this test",
        });
      }

      const now = new Date();

      const cleanSummary = {
        total: summary?.total ?? 0,
        correct: summary?.correct ?? 0,
        attempted: summary?.attempted ?? 0,
        skipped: summary?.skipped ?? 0,
        autoSubmitted: !!summary?.autoSubmitted,
        autoReason: summary?.autoReason || null,
        byCategory: summary?.byCategory || {},
        violations: Array.isArray(summary?.violations)
          ? summary.violations
          : [],
        submittedAt: now,
      };

      await appRef.set(
        {
          score,
          aptitudeScore: score,
          aptitudeSummary: cleanSummary,
          stage: Math.max(app.stage || 2, 2), // ensure at least stage 2
          updatedAt: now,
        },
        { merge: true }
      );

      return res.json({
        message: "Aptitude result saved",
        score,
        summary: cleanSummary,
      });
    } catch (err) {
      console.error("Error submitting aptitude test:", err);
      return res
        .status(500)
        .json({ message: "Failed to submit aptitude test" });
    }
  }
);

module.exports = router;
