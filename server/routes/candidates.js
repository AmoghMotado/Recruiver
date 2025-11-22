// server/routes/candidates.js
const express = require("express");
const router = express.Router();

const { requireAuth, requireRole } = require("../middleware/auth");
const { admin, db } = require("../lib/firebaseAdmin");

const fs = require("fs").promises;
const path = require("path");

// ---- OpenAI client ----
const OpenAI = require("openai");
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const openai =
  openaiApiKey && new OpenAI({ apiKey: openaiApiKey });

/* =========================================================
   Helpers
   ========================================================= */

/**
 * Naive "PDF to text" – we just read the bytes and treat them as text.
 * It's not perfect but good enough for keyword matching + LLM.
 */
async function readResumeText(resumePath) {
  // resumePath like: "/uploads/resumes/1234.pdf"
  const relative = (resumePath || "").replace(/^\/+/, "");
  const fullPath = path.join(process.cwd(), relative);

  const buffer = await fs.readFile(fullPath);

  // Try UTF-8 first, fall back to latin1-ish
  let text = buffer.toString("utf8");
  if (!text || !/\w/.test(text)) {
    text = buffer.toString("latin1");
  }
  return text || "";
}

async function generateATSScore(resumeText, job) {
  // If no OpenAI key/client, use fallback
  if (!openai) {
    console.warn("OPENAI_API_KEY missing – using fallback ATS scoring");
    return generateFallbackScore(resumeText, job);
  }

  try {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the job requirements and provide a detailed scoring breakdown.

JOB DETAILS:
Title: ${job.title || ""}
Company: ${job.company || ""}
Role: ${job.role || ""}
Required Skills: ${(job.requiredSkills || []).join(", ")}
Experience Required: ${job.experience || "Not specified"}
Job Description: ${job.description || "Not provided"}

RESUME TEXT:
${resumeText}

Analyze the resume and provide scores (0-100) for:
1. Overall Match Score
2. Skills Match (how well candidate's skills match required skills)
3. Experience Match (relevant work experience)
4. Education Match (relevant education background)
5. Keyword Match (presence of important keywords)

Also provide:
- Top 3 Strengths (what makes this candidate strong)
- Top 3 Weaknesses or gaps
- Final Recommendation (STRONG_FIT, GOOD_FIT, MODERATE_FIT, or WEAK_FIT)

Return ONLY valid JSON in this exact format with no markdown or code blocks:
{
  "overallScore": number,
  "skillsMatch": number,
  "experienceMatch": number,
  "educationMatch": number,
  "keywordMatch": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendation": "STRONG_FIT or GOOD_FIT or MODERATE_FIT or WEAK_FIT"
}`;

    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const clean = content.replace(/```json\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      overallScore: parsed.overallScore || 0,
      skillsMatch: parsed.skillsMatch || 0,
      experienceMatch: parsed.experienceMatch || 0,
      educationMatch: parsed.educationMatch || 0,
      keywordMatch: parsed.keywordMatch || 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendation: parsed.recommendation || "MODERATE_FIT",
    };
  } catch (err) {
    console.error("Error calling OpenAI for ATS score, using fallback:", err);
    return generateFallbackScore(resumeText, job);
  }
}

// Simple keyword-based fallback if AI fails / no key
function generateFallbackScore(resumeText, job) {
  const resumeLower = (resumeText || "").toLowerCase();
  const skills = job.requiredSkills || [];

  let matched = 0;
  for (const skill of skills) {
    if (!skill) continue;
    if (resumeLower.includes(skill.toLowerCase())) matched++;
  }

  const skillsMatch =
    skills.length > 0 ? Math.round((matched / skills.length) * 100) : 50;
  const overallScore = Math.min(90, skillsMatch + 10);

  return {
    overallScore,
    skillsMatch,
    experienceMatch: 50,
    educationMatch: 50,
    keywordMatch: skillsMatch,
    strengths: [
      "Resume processed successfully",
      "Basic keyword matching with job skills",
    ],
    weaknesses: [
      "Full AI analysis unavailable (fallback mode)",
      "Experience and education not deeply evaluated",
    ],
    recommendation: overallScore >= 70 ? "GOOD_FIT" : "MODERATE_FIT",
  };
}

/* =========================================================
   Routes  (base: /api/candidates)
   ========================================================= */

/**
 * GET /api/candidates/ats-scores
 * Recruiter → fetch all stored ATS scores
 */
router.get(
  "/ats-scores",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const snap = await db.collection("atsScores").get();

      const scores = {};
      snap.forEach((doc) => {
        const data = doc.data() || {};
        scores[doc.id] = {
          email: doc.id,
          overallScore: data.overallScore || 0,
          skillsMatch: data.skillsMatch || 0,
          experienceMatch: data.experienceMatch || 0,
          educationMatch: data.educationMatch || 0,
          keywordMatch: data.keywordMatch || 0,
          strengths: data.strengths || [],
          weaknesses: data.weaknesses || [],
          recommendation: data.recommendation || "MODERATE_FIT",
          generatedAt: data.generatedAt || null,
          updatedAt: data.updatedAt || null,
        };
      });

      return res.json({ success: true, scores });
    } catch (err) {
      console.error("Error fetching ATS scores:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ATS scores",
      });
    }
  }
);

/**
 * POST /api/candidates/generate-ats-score
 * Body: { applicationId, resumePath }
 * Recruiter-only
 */
router.post(
  "/generate-ats-score",
  requireAuth,
  requireRole("RECRUITER"),
  async (req, res) => {
    try {
      const { applicationId, resumePath } = req.body || {};
      if (!applicationId || !resumePath) {
        return res.status(400).json({
          success: false,
          message: "applicationId and resumePath are required",
        });
      }

      // 1) Application
      const appRef = db.collection("applications").doc(applicationId);
      const appSnap = await appRef.get();
      if (!appSnap.exists) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }
      const application = appSnap.data();

      // 2) Job + ownership check
      const jobRef = db.collection("jobs").doc(application.jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }
      const job = jobSnap.data();

      if (job.recruiterId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to score this application",
        });
      }

      // 3) Resume text
      const resumeText = await readResumeText(resumePath);

      // 4) ATS score (OpenAI or fallback)
      const atsScore = await generateATSScore(resumeText, job);

      // 5) Candidate email
      let candidateEmail = null;
      if (application.studentId) {
        const studentSnap = await db
          .collection("users")
          .doc(application.studentId)
          .get();
        if (studentSnap.exists) {
          candidateEmail = studentSnap.data().email || null;
        }
      }

      // 6) Store score
      if (candidateEmail) {
        await db
          .collection("atsScores")
          .doc(candidateEmail)
          .set(
            {
              email: candidateEmail,
              applicationId,
              jobId: application.jobId,
              jobTitle: job.title || "",
              overallScore: atsScore.overallScore,
              skillsMatch: atsScore.skillsMatch,
              experienceMatch: atsScore.experienceMatch,
              educationMatch: atsScore.educationMatch,
              keywordMatch: atsScore.keywordMatch,
              strengths: atsScore.strengths,
              weaknesses: atsScore.weaknesses,
              recommendation: atsScore.recommendation,
              generatedAt:
                admin.firestore.FieldValue.serverTimestamp(),
              updatedAt:
                admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
      }

      return res.json({
        success: true,
        score: atsScore,
        message: "ATS score generated successfully",
      });
    } catch (err) {
      console.error("Error generating ATS score:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to generate ATS score",
      });
    }
  }
);

module.exports = router;
