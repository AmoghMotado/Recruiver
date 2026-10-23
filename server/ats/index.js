// server/ats/index.js
const express = require("express");
const multer = require("multer");
const { extractText } = require("../lib/documentText");
const { requireAuth } = require("../middleware/auth");

const { MAX_FILE_MB } = require("./config");
const { computeGeneralATS, computeMatchATS } = require("./scoring");

const router = express.Router();

// Resume parsing is only available to signed-in users
router.use(requireAuth);

// Multer in-memory upload with size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

/* ------------------------ file → text helper ------------------------ */

async function fileToText(file) {
  if (!file) return "";
  return extractText(file.buffer);
}

/* ------------------------- GENERAL ATS --------------------------- */
/**
 * POST /api/ats/general
 * multipart/form-data:
 *   - resume: file
 *   - (optional) careerLevel, role: text fields
 */
router.post("/general", upload.single("resume"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "Resume file is required.",
      });
    }

    const text = await fileToText(req.file);
    if (!text.trim()) {
      return res.status(400).json({
        ok: false,
        message: "We couldn't read any text from this resume. Please upload a text-based PDF or DOCX (not a scanned image).",
      });
    }

    const options = {
      careerLevel: req.body.careerLevel,
      role: req.body.role,
    };

    const result = computeGeneralATS(text, options);

    return res.json({
      ok: true,
      ...result,
    });
  } catch (err) {
    console.error("ATS general error:", err);
    return next(err);
  }
});

/* --------------------------- MATCH ATS --------------------------- */
/**
 * POST /api/ats/match
 * multipart/form-data:
 *   - resume: file
 *   - jd: file
 *   - (optional) careerLevel, role
 */
router.post(
  "/match",
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jd", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const resumeFile = req.files?.resume?.[0];
      const jdFile = req.files?.jd?.[0];

      if (!resumeFile || !jdFile) {
        return res.status(400).json({
          ok: false,
          message: "Both resume and JD files are required.",
        });
      }

      const resumeText = await fileToText(resumeFile);
      const jdText = await fileToText(jdFile);

      if (!resumeText.trim() || !jdText.trim()) {
        return res.status(400).json({
          ok: false,
          message: "We couldn't read text from the resume or job description. Please upload text-based PDF or DOCX files.",
        });
      }

      const options = {
        careerLevel: req.body.careerLevel,
        role: req.body.role,
      };

      const result = computeMatchATS(resumeText, jdText, options);

      return res.json({
        ok: true,
        ...result,
      });
    } catch (err) {
      console.error("ATS match error:", err);
      return next(err);
    }
  }
);

/* ------------------------ ERROR HANDLER -------------------------- */

router.use((err, req, res, next) => {
  // Multer file size
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `File is too large. Maximum allowed size is ${MAX_FILE_MB} MB.`,
      maxSizeMB: MAX_FILE_MB,
    });
  }

  console.error("ATS router unexpected error:", err);
  return res.status(500).json({
    ok: false,
    message: "Unexpected ATS server error.",
  });
});

module.exports = router;
