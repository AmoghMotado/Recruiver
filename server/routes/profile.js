// server/routes/profile.js
const express = require("express");
const { db } = require("../lib/firebaseAdmin"); // adjust path if needed
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/profile/candidate
 * Returns current user's basic profile + candidate sections
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

    const data = docSnap.data() || {};

    // What the profile page expects as `data.user`
    const user = {
      id: docSnap.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      phone: data.phone || "",
      dob: data.dob || "",
      gender: data.gender || "",
      role: data.role || "CANDIDATE",
      college: data.college || "",
      course: data.course || "",
      cgpa: data.cgpa || "",
      resumeUrl: data.resumeUrl || "",
    };

    // What the profile page expects as `data.candidate`
    const candidate = {
      headline: data.headline || "",
      summary: data.summary || "",
      skills: Array.isArray(data.skills) ? data.skills : [],
      education: Array.isArray(data.education) ? data.education : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      links: Array.isArray(data.links) ? data.links : [],
    };

    return res.json({ user, candidate });
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

    // Fields we allow the frontend to update
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dob",
      "gender",
      "college",
      "course",
      "cgpa",
      "resumeUrl",

      // Candidate-specific sections
      "headline",
      "summary",
      "skills",
      "education",
      "experience",
      "projects",
      "links",
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