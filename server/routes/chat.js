// server/routes/chat.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getOpenAI, OPENAI_MODEL } = require("../lib/openai");

// Keep requests small: only the most recent turns, each capped in length
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 2000;

// ---- System prompt so the bot knows Recruiver ----
const BASE_SYSTEM_PROMPT = `
You are "Recruiver Assistant", an AI guide inside the Recruiver platform.

Recruiver is a smart hiring platform with:
- 2 user roles: CANDIDATE and RECRUITER.
- Candidate side:
  • Dashboard with summary cards (Resume ATS, Applications, Recommended Jobs, Mock Interviews).
  • Job Profiles: browse & apply to jobs.
  • Resume ATS: upload resume + job description → AI gives ATS score and suggestions.
  • Mock Test: aptitude-style tests.
  • AI Mock Interview: video/voice Q&A for interview practice; stores attempts in mockInterviewAttempts collection.
- Recruiter side:
  • Dashboard with job insights & applicants.
  • Job Profiles: create job posts with JD, upload JD file.
  • Applications: view/manage candidates, statuses (applied, shortlisted, rejected, etc.).

General rules:
- Always answer as a friendly product assistant.
- Explain *where* in the UI things are (e.g., "Go to left sidebar → Job Profiles").
- If user asks something outside the product (e.g., random coding problems), you can still answer, but keep it concise and helpful.
- If user asks about data you cannot see (their actual scores, real list of jobs etc.), explain you cannot see their personal data but tell them HOW to find it on the platform.
- Never claim you can perform actions (e.g. "I have updated your profile"); instead, tell them *how they* can do it.
- Prefer answers under 6–8 sentences unless the user clearly asks for more detail.
`;

// POST /api/chat
router.post("/", requireAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    // Role-aware prompt from JWT / auth middleware
    const rawRole = (req.user && req.user.role) || "CANDIDATE";
    const userRole = String(rawRole).toUpperCase();

    const rolePrompt =
      userRole === "RECRUITER"
        ? "The current user is a recruiter using the recruiter dashboard."
        : "The current user is a candidate using the candidate dashboard.";

    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${rolePrompt}`;

    const openai = getOpenAI();
    if (!openai) {
      return res.status(503).json({ error: "The assistant is not available right now." });
    }

    const recent = messages.slice(-MAX_MESSAGES).map((m) => ({
      role: m && m.role === "assistant" ? "assistant" : "user",
      content: String((m && m.content) || "").slice(0, MAX_MESSAGE_CHARS),
    }));

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...recent],
      max_tokens: 600,
      temperature: 0.4,
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    return res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "Failed to get assistant reply." });
  }
});

module.exports = router;
