// server/routes/forum.js
const express = require("express");
const router = express.Router();
const { db } = require("../lib/firebaseAdmin");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/forum/messages  -> last 100 messages, oldest first
router.get("/messages", requireAuth, async (req, res) => {
  try {
    const snap = await db
      .collection("forumMessages")
      .orderBy("createdAt", "asc")
      .limit(100)
      .get();

    const messages = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        content: data.content || "",
        createdAt: data.createdAt || null,
        authorName: data.authorName || "Candidate",
      };
    });

    return res.json({ messages });
  } catch (err) {
    console.error("forum get error", err);
    return res.status(500).json({ message: "Failed to load messages" });
  }
});

// POST /api/forum/messages  -> add new message (candidates only)
router.post(
  "/messages",
  requireAuth,
  requireRole("CANDIDATE"),
  async (req, res) => {
    try {
      const { content } = req.body || {};
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }

      const userId = req.user.id;
      const userDoc = await db.collection("users").doc(userId).get();
      let authorName = "Candidate";

      if (userDoc.exists) {
        const u = userDoc.data();
        authorName =
          `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Candidate";
      }

      const now = new Date();
      const ref = await db.collection("forumMessages").add({
        content: content.trim(),
        authorId: userId,
        authorName,
        createdAt: now,
      });

      return res.status(201).json({
        message: {
          id: ref.id,
          content: content.trim(),
          createdAt: now,
          authorName,
        },
      });
    } catch (err) {
      console.error("forum post error", err);
      return res.status(500).json({ message: "Failed to send message" });
    }
  }
);

module.exports = router;
