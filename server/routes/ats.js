// server/routes/ats.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { db } = require("../lib/firebaseAdmin");
const { requireAuth, requireRole } = require("../middleware/auth");
const { computeGeneralATS, computeMatchATS } = require("../ats/scoring");

const router = express.Router();

/* ------------------------------ MULTER SETUP ------------------------------ */

// Memory storage for pure ATS analysis (no temp files)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

// Disk storage for existing /upload-score endpoint (kept as-is for Round 1)
const uploadDir = path.join(process.cwd(), "uploads", "ats");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const diskUpload = multer({ dest: uploadDir });

/* ----------------------------- FILE → TEXT helper ------------------------- */
/**
 * Safely convert an uploaded file to plain UTF-8 text.
 * We intentionally avoid pdf-parse here to keep things stable across
 * environments. For normal text-based PDFs and DOCX→text conversions,
 * Buffer.toString("utf8") works well enough for ATS scoring.
 */
async function fileToText(file) {
  if (!file) return "";
  return file.buffer.toString("utf8");
}

/* ---------------------------- BASIC ATS ENDPOINTS ------------------------- */

/**
 * POST /api/ats/general
 * multipart/form-data with field "resume"
 */
router.post("/general", memoryUpload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "Resume file is required" });
    }

    const text = await fileToText(req.file);
    if (!text.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: "Could not read text from resume" });
    }

    const result = computeGeneralATS(text);

    return res.json({
      ok: true,
      ...result, // { score, breakdown, suggestions, meta }
    });
  } catch (err) {
    console.error("ATS general error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "ATS analysis failed" });
  }
});

/**
 * POST /api/ats/match
 * multipart/form-data with fields "resume" and "jd"
 */
router.post(
  "/match",
  memoryUpload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jd", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const resumeFile = req.files?.resume?.[0];
      const jdFile = req.files?.jd?.[0];

      if (!resumeFile || !jdFile) {
        return res.status(400).json({
          ok: false,
          message: "Resume and JD files are both required",
        });
      }

      const resumeText = await fileToText(resumeFile);
      const jdText = await fileToText(jdFile);

      if (!resumeText.trim() || !jdText.trim()) {
        return res.status(400).json({
          ok: false,
          message: "Could not read text from resume or JD",
        });
      }

      const result = computeMatchATS(resumeText, jdText);

      return res.json({
        ok: true,
        ...result, // { score, general, match }
      });
    } catch (err) {
      console.error("ATS match error:", err);
      return res
        .status(500)
        .json({ ok: false, message: "ATS match failed" });
    }
  }
);

/* ----------------------- EXISTING FIRESTORE MATCH ROUTE ------------------- */
/**
 * This is your original Round-1 upload-score endpoint. Kept as-is.
 */

// DEMO parser: reads bytes as text and extracts simple skills
function extractSkillsFromText(txt) {
  if (!txt) return [];
  const words = txt
    .toLowerCase()
    .replace(/[^a-z0-9+.# ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const DICT = [
    "react",
    "react.js",
    "reactjs",
    "next",
    "next.js",
    "javascript",
    "typescript",
    "node",
    "express",
    "prisma",
    "postgresql",
    "mysql",
    "mongodb",
    "sql",
    "html",
    "css",
    "tailwind",
    "redux",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "python",
    "java",
    "spring",
    "git",
    "github",
    "ci",
    "cd",
    "rest",
    "api",
    "graphql",
  ];

  const norm = new Set(
    words.map((w) => w.replace(/\.js$/, "").replace(/js$/, ""))
  );

  const set = new Set();
  for (const d of DICT) {
    const key = d.replace(/\.js$/, "").replace(/js$/, "");
    if (norm.has(key)) set.add(key);
  }
  return Array.from(set);
}

function scoreMatch(resumeSkills = [], jobSkillsSource = "") {
  let jobSkills = [];

  if (Array.isArray(jobSkillsSource)) {
    jobSkills = jobSkillsSource
      .map((s) => String(s || "").toLowerCase())
      .filter(Boolean);
  } else {
    jobSkills = String(jobSkillsSource || "")
      .toLowerCase()
      .replace(/\.js/g, "")
      .split(/[,|/•\- ]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const jobSet = new Set(jobSkills);
  const matched = [];
  const missing = [];
  let hit = 0;

  for (const s of jobSet) {
    if (resumeSkills.includes(s)) {
      hit++;
      matched.push(s);
    } else {
      missing.push(s);
    }
  }

  const denom = Math.max(1, jobSet.size);
  const score = Math.round((hit / denom) * 100);

  return { score, matched, missing, jobSkills: Array.from(jobSet) };
}

router.post(
  "/upload-score",
  requireAuth,
  requireRole("CANDIDATE"),
  diskUpload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const jobId = String(req.body.jobId || "").trim();
      if (!jobId) {
        return res.status(400).json({ message: "jobId is required" });
      }

      // 1. Load job from Firestore
      const jobDoc = await db.collection("jobs").doc(jobId).get();
      if (!jobDoc.exists) {
        return res.status(404).json({ message: "Job not found" });
      }
      const job = { id: jobDoc.id, ...jobDoc.data() };

      // 2. Read file and extract skills
      const fullPath = req.file.path;
      const buffer = fs.readFileSync(fullPath);
      const text = buffer.toString("utf8");
      const extractedSkills = extractSkillsFromText(text);

      // cleanup temp file
      try {
        fs.unlinkSync(fullPath);
      } catch (_) {}

      // 3. Score match against job skills
      const jobSkillsSource =
        job.requiredSkills || job.stack || job.skills || "";
      const { score, matched, missing, jobSkills } = scoreMatch(
        extractedSkills,
        jobSkillsSource
      );

      // 4. Upsert into `applications` collection
      const studentId = req.user.id;
      const appsRef = db.collection("applications");
      const existingSnap = await appsRef
        .where("jobId", "==", jobId)
        .where("studentId", "==", studentId)
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
        studentId,
        resumeScore: score,
        atsMatchedSkills: matched,
        atsMissingSkills: missing,
        atsExtractedSkills: extractedSkills,
        jobSkills,
        status: "ROUND1_DONE",
        updatedAt: now,
      };
      if (isNew) payload.createdAt = now;

      await appRef.set(payload, { merge: true });

      return res.json({
        filename: req.file.originalname,
        score,
        matched,
        missing,
        job,
        jobSkills,
        extractedSkills,
        applicationId: appRef.id,
      });
    } catch (e) {
      console.error("POST /api/ats/upload-score error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
