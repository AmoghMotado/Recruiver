// server/routes/jobs.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { requireAuth, requireRole } = require("../middleware/auth");
const { db } = require("../lib/firebaseAdmin");

// ---------- JD upload (filesystem only) ----------
const uploadDir = path.join(process.cwd(), "uploads", "job-descriptions");
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".doc", ".docx"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

/**
 * POST /api/jobs/upload-jd
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

// ---------- JOB CRUD + APPLICATIONS (Firestore) ----------

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
    const docRef = await db.collection("jobs").add({
      recruiterId: req.user.id,
      title,
      company,
      role,
      salary,
      location,
      salaryRange,
      experience,
      deadline: deadline || null,
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
      deadline: deadline || null,
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
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    let ref = db.collection("jobs").where("status", "==", "OPEN");
    ref = ref.orderBy("createdAt", "desc");

    const snap = await ref.get();
    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ jobs });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

/**
 * GET /api/jobs/my
 * Recruiter’s jobs
 */
router.get("/my", requireAuth, requireRole("RECRUITER"), async (req, res) => {
  try {
    const snap = await db
      .collection("jobs")
      .where("recruiterId", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .get();

    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
 */
router.post(
  "/:id/apply",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const jobId = req.params.id;
      const userId = req.user.id;

      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        return res.status(404).json({ message: "Job not found" });
      }

      const appsRef = db.collection("applications");
      const existingSnap = await appsRef
        .where("jobId", "==", jobId)
        .where("studentId", "==", userId)
        .limit(1)
        .get();

      const now = new Date();
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
        status: "APPLIED",
        updatedAt: now,
      };
      if (isNew) payload.createdAt = now;

      await appRef.set(payload, { merge: true });

      return res.status(201).json({
        message: "Application recorded",
        applicationId: appRef.id,
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
        for (let i = 0; i < jobIds.length; i += 10) {
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
 * Recruiter: applicants for a single job
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
        return {
          id: doc.id,
          ...data,
          candidate: usersById[data.studentId] || null,
        };
      });

      return res.json({ applicants });
    } catch (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ message: "Failed to fetch applicants" });
    }
  }
);

module.exports = router;
