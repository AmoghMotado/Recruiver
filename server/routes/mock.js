// server/routes/mock.js
const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebaseAdmin");
const { requireAuth, requireRole } = require("../middleware/auth");

// --- Simple question bank (add more as needed) ---
const BANK = {
  quant: [
    {
      id: "q1",
      q: "What is the value of 12 + 15 × 2?",
      options: ["54", "42", "39", "27"],
      answer: 1, // 12 + (15×2) = 42
    },
    {
      id: "q2",
      q: "If a train runs at 60 km/h for 2.5 hours, the distance covered is?",
      options: ["120 km", "130 km", "140 km", "150 km"],
      answer: 3,
    },
    {
      id: "q3",
      q: "The average of 10, 20, 30, 40 is:",
      options: ["20", "22.5", "25", "30"],
      answer: 2,
    },
  ],
  verbal: [
    {
      id: "v1",
      q: "Choose the correctly spelled word:",
      options: ["Definately", "Definitely", "Definatly", "Definetly"],
      answer: 1,
    },
    {
      id: "v2",
      q: "Find the synonym of 'Concise':",
      options: ["Verbose", "Succinct", "Ambiguous", "Diffuse"],
      answer: 1,
    },
    {
      id: "v3",
      q: "Fill in the blank: She is superior ___ him.",
      options: ["than", "to", "from", "over"],
      answer: 1,
    },
  ],
  logical: [
    {
      id: "l1",
      q: "Find the odd one out: 2, 6, 12, 20, 30, 42, 56, 70",
      options: ["12", "20", "30", "70"],
      answer: 3, // n(n+1): last should be 72 → 70 is odd
    },
    {
      id: "l2",
      q: "If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are:",
      options: ["Lazzies", "Razzies", "Neither", "Both A and B"],
      answer: 3,
    },
    {
      id: "l3",
      q: "Complete the series: A, C, F, J, O, __",
      options: ["U", "T", "S", "R"],
      answer: 0, // +2,+3,+4,+5,+6 → U
    },
  ],
};

function sample(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(1, Math.min(n, copy.length)));
}

// GET /api/mock/questions
router.get("/questions", async (req, res) => {
  try {
    const topic = String(req.query.topic || "quant");
    const count = Number(req.query.count || 10);
    if (!BANK[topic]) return res.status(400).json({ message: "Invalid topic" });

    const qs = sample(BANK[topic], count).map((q, i) => ({
      ...q,
      id: `${q.id}-${Date.now()}-${i}`,
    }));

    return res.json({ questions: qs });
  } catch (e) {
    console.error("GET /api/mock/questions error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/mock/submit
// body: { topic: 'quant' | 'verbal' | 'logical', score: number, jobId?: string }
router.post(
  "/submit",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { topic, score, jobId } = req.body || {};

      if (!["quant", "verbal", "logical"].includes(topic)) {
        return res.status(400).json({ message: "Invalid topic" });
      }

      const numericScore = Number(score);
      if (Number.isNaN(numericScore)) {
        return res.status(400).json({ message: "Invalid score" });
      }

      // 1. Save aptitude attempt
      const now = new Date();
      await db.collection("aptitudeAttempts").add({
        userId,
        topic,
        score: numericScore,
        jobId: jobId || null,
        takenAt: now,
      });

      // 2. Optionally update applications (if jobId provided)
      if (jobId) {
        const appsRef = db.collection("applications");
        const existingSnap = await appsRef
          .where("jobId", "==", jobId)
          .where("studentId", "==", userId)
          .limit(1)
          .get();

        if (!existingSnap.empty) {
          const appRef = existingSnap.docs[0].ref;
          await appRef.set(
            {
              aptitudeScore: numericScore,
              status: "ROUND2_DONE",
              updatedAt: now,
            },
            { merge: true }
          );
        }
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("POST /api/mock/submit error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
