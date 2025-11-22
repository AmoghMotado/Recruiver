// server/routes/jobs.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { requireAuth, requireRole } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

/* =========================================================
   Helpers
   ========================================================= */

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Firestore Timestamp
  if (typeof value === "object") {
    if (typeof value.toDate === "function") return value.toDate();
    const sec = value.seconds ?? value._seconds;
    if (typeof sec === "number") return new Date(sec * 1000);
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * If job has a deadline and it's in the past, mark it CLOSED.
 * Returns the (possibly updated) job data.
 */
async function autoCloseIfDeadlinePassed(docId, jobData, now = new Date()) {
  const deadline = toDate(jobData.deadline);
  if (!deadline) return jobData;

  const isOpen =
    jobData.status === "OPEN" ||
    jobData.status === "Open" ||
    jobData.status === "open";

  if (isOpen && now > deadline) {
    const updates = {
      status: "CLOSED",
      updatedAt: now,
    };
    await db.collection("jobs").doc(docId).set(updates, { merge: true });
    return { ...jobData, ...updates };
  }

  return jobData;
}

/* =========================================================
   File upload helpers (JD + Resume)
   ========================================================= */

const uploadBaseDir = path.join(process.cwd(), "uploads");

// ensure base upload directory exists
if (!fs.existsSync(uploadBaseDir)) {
  fs.mkdirSync(uploadBaseDir, { recursive: true });
}

// --- JD upload dir ---
const jdDir = path.join(uploadBaseDir, "job-descriptions");
if (!fs.existsSync(jdDir)) {
  fs.mkdirSync(jdDir, { recursive: true });
}

// --- Resume upload dir ---
const resumeDir = path.join(uploadBaseDir, "resumes");
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

// Multer storage that chooses folder based on fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "jd") {
      cb(null, jdDir);
    } else if (file.fieldname === "resume") {
      cb(null, resumeDir);
    } else {
      cb(null, uploadBaseDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".doc", ".docx"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

/* =========================================================
   Upload endpoints
   ========================================================= */

/**
 * POST /api/jobs/upload-jd
 * Recruiter uploads a Job Description file
 */
router.post(
  "/upload-jd",
  requireAuth,
  requireRole("RECRUITER"),
  upload.single("jd"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/job-descriptions/${req.file.filename}`;
      return res.json({
        filePath,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (err) {
      console.error("Error uploading JD:", err);
      return res.status(500).json({ message: "Failed to upload file" });
    }
  }
);

/**
 * POST /api/jobs/upload-resume
 * Candidate uploads a resume file
 */
router.post(
  "/upload-resume",
  requireAuth,
  requireRole("CANDIDATE"),
  upload.single("resume"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/resumes/${req.file.filename}`;
      return res.json({
        filePath,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (err) {
      console.error("Error uploading resume:", err);
      return res.status(500).json({ message: "Failed to upload resume" });
    }
  }
);

/* =========================================================
   JOB CRUD + APPLICATIONS (Firestore)
   ========================================================= */

/**
 * POST /api/jobs
 * Create a new job posting (Recruiter only)
 */
router.post("/", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  try {
    const {
      title,
      company,
      location = "",
      salaryRange = "",
      experience = "",
      deadline = "",
      description = "",
      jdFilePath = "",
      requiredSkills = [],
      openings = 1,
      role = "",
      salary = "",
    } = req.body || {};

    if (!title || !company) {
      return res
        .status(400)
        .json({ message: "Title and company are required" });
    }

    const now = new Date();
    const deadlineDate = toDate(deadline);

    const docRef = await db.collection("jobs").add({
      recruiterId: req.user.id,
      title,
      company,
      role,
      salary,
      location,
      salaryRange,
      experience,
      deadline: deadlineDate || null,
      description,
      jdFilePath,
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills
        : String(requiredSkills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
      openings: Number(openings) || 1,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    });

    const job = {
      id: docRef.id,
      title,
      company,
      role,
      salary,
      location,
      salaryRange,
      experience,
      deadline: deadlineDate || null,
      description,
      jdFilePath,
      requiredSkills:
        Array.isArray(requiredSkills) && requiredSkills.length
          ? requiredSkills
          : String(requiredSkills || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      openings: Number(openings) || 1,
      recruiterId: req.user.id,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    };

    return res.status(201).json({ job });
  } catch (err) {
    console.error("Error creating job:", err);
    return res.status(500).json({ message: "Failed to create job" });
  }
});

/**
 * GET /api/jobs
 * List open jobs for authenticated users
 * (auto-closes jobs whose deadline is past)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const now = new Date();
    // fetch all jobs, then filter + auto-close based on deadline/status
    const snap = await db.collection("jobs").orderBy("createdAt", "desc").get();

    const jobs = [];
    for (const doc of snap.docs) {
      let data = doc.data();
      data = await autoCloseIfDeadlinePassed(doc.id, data, now);

      const isOpen =
        data.status === "OPEN" ||
        data.status === "Open" ||
        data.status === "open";

      const deadline = toDate(data.deadline);
      const stillAccepting = !deadline || now <= deadline;

      if (isOpen && stillAccepting) {
        jobs.push({ id: doc.id, ...data });
      }
    }

    return res.json({ jobs });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/**
 * GET /api/jobs/my
 * Recruiter’s jobs (shows open + closed, but auto-closes past-deadline ones)
 */
router.get("/my", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  try {
    const now = new Date();
    const snap = await db
      .collection("jobs")
      .where("recruiterId", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .get();

    const jobs = [];
    for (const doc of snap.docs) {
      let data = doc.data();
      data = await autoCloseIfDeadlinePassed(doc.id, data, now);
      jobs.push({ id: doc.id, ...data });
    }

    return res.json({ jobs });
  } catch (err) {
    console.error("Error fetching recruiter jobs:", err);
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/**
 * PUT /api/jobs/:id
 * Update job (Recruiter only, must own job)
 */
router.put("/:id", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  try {
    const { id } = req.params;
    const jobRef = db.collection("jobs").doc(id);
    const jobSnap = await jobRef.get();

    if (!jobSnap.exists) {
      return res.status(404).json({ message: "Job not found" });
    }
    const job = jobSnap.data();
    if (job.recruiterId !== req.user.id) {
      return res.status(403).json({ message: "Not your job posting" });
    }

    const updates = {
      ...req.body,
      deadline: req.body.deadline ? toDate(req.body.deadline) : job.deadline,
      requiredSkills: Array.isArray(req.body.requiredSkills)
        ? req.body.requiredSkills
        : req.body.requiredSkills
        ? String(req.body.requiredSkills)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : job.requiredSkills || [],
      updatedAt: new Date(),
    };

    await jobRef.set(updates, { merge: true });
    const updated = { id: jobSnap.id, ...job, ...updates };

    return res.json({ message: "Job updated", job: updated });
  } catch (err) {
    console.error("Error updating job:", err);
    return res.status(500).json({ message: "Failed to update job" });
  }
});

/**
 * DELETE /api/jobs/:id
 */
router.delete(
  "/:id",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const jobRef = db.collection("jobs").doc(id);
      const jobSnap = await jobRef.get();

      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res.status(403).json({ message: "Not your job posting" });
      }

      await jobRef.delete();
      return res.json({ message: "Job deleted", id });
    } catch (err) {
      console.error("Error deleting job:", err);
      return res.status(500).json({ message: "Failed to delete job" });
    }
  }
);

/**
 * POST /api/jobs/:id/apply
 * Candidate applies to a job → create or update application
 * Expects body: { resumePath?: string }
 * Enforces deadline + status.
 */
router.post(
  "/:id/apply",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;
      const { resumePath = "" } = req.body || {};

      const jobRef = db.collection("jobs").doc(jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      let job = jobSnap.data();

      const now = new Date();
      // auto-close if past deadline
      job = await autoCloseIfDeadlinePassed(jobId, job, now);

      const isOpen =
        job.status === "OPEN" ||
        job.status === "Open" ||
        job.status === "open";

      const deadline = toDate(job.deadline);

      if (!isOpen) {
        return res
          .status(400)
          .json({ message: "Applications are closed for this job" });
      }

      if (deadline && now > deadline) {
        // double safety – if somehow still open
        await jobRef.set(
          { status: "CLOSED", updatedAt: now },
          { merge: true }
        );
        return res
          .status(400)
          .json({ message: "Applications are closed for this job" });
      }

      const appsRef = db.collection("applications");
      const existingSnap = await appsRef
        .where("jobId", "==", jobId)
        .where("studentId", "==", userId)
        .limit(1)
        .get();

      let appRef;
      let isNew = false;

      if (existingSnap.empty) {
        appRef = appsRef.doc();
        isNew = true;
      } else {
        appRef = existingSnap.docs[0].ref;
      }

      const payload = {
        jobId,
        studentId: userId,
        recruiterId: job.recruiterId || null,
        status: "APPLIED",
        stage: 1,
        resumePath: resumePath || "",
        updatedAt: now,
      };
      if (isNew) payload.createdAt = now;

      await appRef.set(payload, { merge: true });

      return res.status(201).json({
        message: "Application recorded",
        applicationId: appRef.id,
        application: { id: appRef.id, ...payload },
      });
    } catch (err) {
      console.error("Error applying to job:", err);
      return res.status(500).json({ message: "Failed to apply to job" });
    }
  }
);

/**
 * GET /api/jobs/applied
 * Candidate’s applied jobs
 */
router.get(
  "/applied",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const appsSnap = await db
        .collection("applications")
        .where("studentId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      if (appsSnap.empty) {
        return res.json({ applications: [] });
      }

      const jobIds = [
        ...new Set(appsSnap.docs.map((d) => d.data().jobId || "")),
      ].filter(Boolean);

      const jobsById = {};
      if (jobIds.length) {
        const chunks = [];
        for (let i = 0; i < jobIds.length; i += 10; i += 1) {
          chunks.push(jobIds.slice(i, i + 10));
        }
        for (const chunk of chunks) {
          const snap = await db
            .collection("jobs")
            .where("__name__", "in", chunk)
            .get();
          snap.forEach((doc) => {
            jobsById[doc.id] = { id: doc.id, ...doc.data() };
          });
        }
      }

      const applications = appsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          job: jobsById[data.jobId] || null,
        };
      });

      return res.json({ applications });
    } catch (err) {
      console.error("Error fetching applications:", err);
      return res.status(500).json({ message: "Failed to fetch applications" });
    }
  }
);

/**
 * GET /api/jobs/applicants?jobId=...
 * Recruiter: applicants for a single job (used by dashboard widgets)
 */
router.get(
  "/applicants",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const recruiterId = req.user.id;
      const { jobId } = req.query;

      if (!jobId) {
        return res.status(400).json({ message: "jobId query param required" });
      }

      const jobDoc = await db.collection("jobs").doc(jobId).get();
      if (!jobDoc.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobDoc.data();
      if (job.recruiterId !== recruiterId) {
        return res.status(403).json({ message: "Not your job posting" });
      }

      const appsSnap = await db
        .collection("applications")
        .where("jobId", "==", jobId)
        .orderBy("createdAt", "desc")
        .get();

      if (appsSnap.empty) {
        return res.json({ applicants: [] });
      }

      const studentIds = [
        ...new Set(appsSnap.docs.map((d) => d.data().studentId || "")),
      ].filter(Boolean);

      const usersById = {};
      const chunks = [];
      for (let i = 0; i < studentIds.length; i += 10) {
        chunks.push(studentIds.slice(i, i + 10));
      }
      for (const chunk of chunks) {
        const snap = await db
          .collection("users")
          .where("__name__", "in", chunk)
          .get();
        snap.forEach((doc) => {
          usersById[doc.id] = { id: doc.id, ...doc.data() };
        });
      }

      const applicants = appsSnap.docs.map((doc) => {
        const data = doc.data();
        const aptitudeSummary = data.aptitudeSummary || {};
        const violationSummary = aptitudeSummary.violationSummary || {};
        const totalViolations =
          typeof violationSummary.totalViolations === "number"
            ? violationSummary.totalViolations
            : Array.isArray(aptitudeSummary.violations)
            ? aptitudeSummary.violations.length
            : 0;

        return {
          id: doc.id,
          ...data,
          candidate: usersById[data.studentId] || null,
          // surfaced aptitude info for job-detail pipeline
          aptitudeScore:
            typeof data.score === "number" ? data.score : null,
          aptitudeAutoSubmitted: !!aptitudeSummary.autoSubmitted,
          aptitudeViolations: totalViolations,
          aptitudeViolationSummary: violationSummary,
          aptitudeSummary,
        };
      });

      return res.json({ applicants });
    } catch (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ message: "Failed to fetch applicants" });
    }
  }
);

/**
 * GET /api/jobs/recruiter-candidates
 * Recruiter-wide view of ALL candidates (all jobs)
 */
router.get(
  "/recruiter-candidates",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const recruiterId = req.user.id;

      // 1) Fetch recruiter jobs
      const jobsSnap = await db
        .collection("jobs")
        .where("recruiterId", "==", recruiterId)
        .get();

      if (jobsSnap.empty) {
        return res.json({ candidates: [] });
      }

      const jobsById = {};
      const jobIds = [];
      for (const doc of jobsSnap.docs) {
        jobsById[doc.id] = { id: doc.id, ...doc.data() };
        jobIds.push(doc.id);
      }

      // 2) Fetch applications for all these jobs (chunked)
      const apps = [];
      const jobChunks = [];
      for (let i = 0; i < jobIds.length; i += 10) {
        jobChunks.push(jobIds.slice(i, i + 10));
      }

      for (const chunk of jobChunks) {
        const snap = await db
          .collection("applications")
          .where("jobId", "in", chunk)
          .get();
        snap.forEach((doc) => {
          apps.push({ id: doc.id, ...doc.data() });
        });
      }

      if (!apps.length) {
        return res.json({ candidates: [] });
      }

      // 3) Fetch user documents for all students
      const studentIds = [
        ...new Set(apps.map((a) => a.studentId || "")),
      ].filter(Boolean);

      const usersById = {};
      const userChunks = [];
      for (let i = 0; i < studentIds.length; i += 10) {
        userChunks.push(studentIds.slice(i, i + 10));
      }
      for (const chunk of userChunks) {
        const snap = await db
          .collection("users")
          .where("__name__", "in", chunk)
          .get();
        snap.forEach((doc) => {
          usersById[doc.id] = { id: doc.id, ...doc.data() };
        });
      }

      // 4) Map into flat candidate rows for the UI
      const candidates = apps.map((app) => {
        const user = usersById[app.studentId] || {};
        const job = jobsById[app.jobId] || {};

        const name =
          (user.firstName || user.lastName
            ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
            : user.name || "") || "Unknown";

        const aptitudeSummary = app.aptitudeSummary || {};
        const violationSummary = aptitudeSummary.violationSummary || {};
        const totalViolations =
          typeof violationSummary.totalViolations === "number"
            ? violationSummary.totalViolations
            : Array.isArray(aptitudeSummary.violations)
            ? aptitudeSummary.violations.length
            : 0;

        return {
          id: app.id,
          applicationId: app.id,
          studentId: app.studentId,
          jobId: app.jobId,
          name,
          email: user.email || "",
          jobTitle: job.title || "",
          company: job.company || "",
          status: app.status || "APPLIED",
          score: app.score ?? 0,
          stage: app.stage ?? 1,
          appliedDate: app.createdAt || null,
          resumePath: app.resumePath || "",
          // Round-2 aptitude surfaced cleanly for recruiter table
          aptitudeScore:
            typeof app.score === "number" ? app.score : null,
          aptitudeAutoSubmitted: !!aptitudeSummary.autoSubmitted,
          aptitudeViolations: totalViolations,
          aptitudeViolationSummary: violationSummary,
          aptitudeSummary,
        };
      });

      // Sort newest first
      candidates.sort((a, b) => {
        const ad = a.appliedDate
          ? new Date(
              adValue(a.appliedDate)
            )
          : 0;
        const bd = b.appliedDate
          ? new Date(
              adValue(b.appliedDate)
            )
          : 0;
        return bd - ad;
      });

      function adValue(v) {
        return v._seconds ? v._seconds * 1000 : v;
      }

      return res.json({ candidates });
    } catch (err) {
      console.error("Error fetching recruiter candidates:", err);
      return res.status(500).json({ message: "Failed to load candidates" });
    }
  }
);

/**
 * POST /api/jobs/applications/:id/aptitude-score
 * Candidate submits Round 2 aptitude test score.
 * Body: {
 *   score: number,
 *   summary?: {
 *     total, correct, attempted, skipped,
 *     autoSubmitted, byCategory,
 *     violations, violationSummary,
 *     startedAt, completedAt, durationSeconds, ...
 *   }
 * }
 */
router.post(
  "/applications/:id/aptitude-score",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { score, summary } = req.body || {};

      const numericScore = Number(score);
      if (Number.isNaN(numericScore)) {
        return res.status(400).json({ message: "Invalid score" });
      }

      const appRef = db.collection("applications").doc(id);
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      if (app.studentId !== req.user.id) {
        return res.status(403).json({ message: "Not your application" });
      }

      const now = new Date();

      // status progression: ensure candidate doesn't get downgraded
      let nextStatus = app.status || "APPLIED";
      if (nextStatus === "SHORTLISTED") {
        nextStatus = "UNDER_REVIEW";
      }

      const updates = {
        score: numericScore,
        status: nextStatus,
        stage: app.stage && app.stage > 2 ? app.stage : 2,
        updatedAt: now,
      };

      if (summary && typeof summary === "object") {
        // Normalize timing
        const startedAt = summary.startedAt ? toDate(summary.startedAt) : null;
        const completedAt = summary.completedAt
          ? toDate(summary.completedAt)
          : now;
        const durationSeconds = Number(summary.durationSeconds);
        const safeDuration = Number.isNaN(durationSeconds)
          ? null
          : durationSeconds;

        // Normalize violations
        const violations = Array.isArray(summary.violations)
          ? summary.violations
          : [];
        const violationSummary =
          summary.violationSummary && typeof summary.violationSummary === "object"
            ? summary.violationSummary
            : {};

        const totalViolations =
          typeof violationSummary.totalViolations === "number"
            ? violationSummary.totalViolations
            : violations.length;

        updates.aptitudeSummary = {
          ...summary,
          startedAt: startedAt || null,
          completedAt: completedAt || null,
          durationSeconds: safeDuration,
          violations,
          violationSummary: {
            ...violationSummary,
            totalViolations,
          },
          lastUpdatedAt: now,
        };

        updates.aptitudeStartedAt = startedAt || app.aptitudeStartedAt || null;
        updates.aptitudeCompletedAt = completedAt;
        updates.aptitudeDurationSeconds = safeDuration;
      }

      await appRef.set(updates, { merge: true });
      const updated = { id: appSnap.id, ...app, ...updates };

      return res.json({
        message: "Aptitude score recorded",
        application: updated,
      });
    } catch (err) {
      console.error(
        "Error in POST /api/jobs/applications/:id/aptitude-score:",
        err
      );
      return res
        .status(500)
        .json({ message: "Failed to record aptitude score" });
    }
  }
);

/**
 * POST /api/jobs/applications/:id/status
 * Recruiter updates an application's status / stage / score
 * Body: {
 *   status?: "APPLIED"|"UNDER_REVIEW"|"SHORTLISTED"|"REJECTED",
 *   stage?: number,
 *   score?: number
 * }
 */
router.post(
  "/applications/:id/status",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, stage, score } = req.body || {};

      const allowedStatuses = [
        "APPLIED",
        "UNDER_REVIEW",
        "SHORTLISTED",
        "REJECTED",
      ];

      const appRef = db.collection("applications").doc(id);
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({ message: "Application not found" });
      }
      const app = appSnap.data();

      // Ensure recruiter owns the job for this application
      const jobSnap = await db.collection("jobs").doc(app.jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = jobSnap.data();
      if (job.recruiterId !== req.user.id) {
        return res
          .status(403)
          .json({ message: "You are not allowed to update this application" });
      }

      const updates = { updatedAt: new Date() };

      if (status && allowedStatuses.includes(status)) {
        updates.status = status;
        // simple default stage mapping
        if (!("stage" in req.body)) {
          if (status === "SHORTLISTED") updates.stage = 2;
          else if (status === "UNDER_REVIEW") updates.stage = 1;
          else if (status === "REJECTED") updates.stage = 1;
        }
      }

      if (typeof stage === "number") {
        updates.stage = stage;
      }

      if (typeof score === "number") {
        updates.score = score;
      }

      await appRef.set(updates, { merge: true });
      const updated = { id: appSnap.id, ...app, ...updates };

      return res.json({
        message: "Application updated",
        application: updated,
      });
    } catch (err) {
      console.error("Error updating application status:", err);
      return res.status(500).json({ message: "Failed to update application" });
    }
  }
);

module.exports = router;
