// server/routes/profile.js
const express = require("express");
const { db } = require("../lib/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/profile/candidate
 * Returns current user's basic profile
 */
router.get("/candidate", requireAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const docRef = db.collection("users").doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = docSnap.data();

    const profile = {
      id: docSnap.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email,
      phone: data.phone || "",
      dob: data.dob || "",
      gender: data.gender || "",
      role: data.role || "CANDIDATE",
      college: data.college || "",
      course: data.course || "",
      cgpa: data.cgpa || "",
      skills: data.skills || [],
      resumeUrl: data.resumeUrl || "",
    };

    return res.json({ user: profile });
  } catch (err) {
    console.error("/api/profile/candidate GET error (Firebase):", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * PUT /api/profile/candidate
 * Update candidate profile fields
 */
router.put("/candidate", requireAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "dob",
      "gender",
      "college",
      "course",
      "cgpa",
      "skills",
      "resumeUrl",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }
    updates.updatedAt = new Date().toISOString();

    await db.collection("users").doc(userId).set(updates, { merge: true });

    return res.json({ ok: true });
  } catch (err) {
    console.error("/api/profile/candidate PUT error (Firebase):", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
