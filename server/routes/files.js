// server/routes/files.js
// GET /uploads/:kind/:filename – authenticated access to uploaded files.
//   job-descriptions: any signed-in user (they are shown on job postings)
//   resumes: the candidate who uploaded or applied with it, or the recruiter
//            who owns a job that received an application with it
const express = require("express");
const fs = require("fs");
const { db } = require("../lib/firebaseAdmin");
const { requireAuth } = require("../middleware/auth");
const { parseUploadPath } = require("../lib/uploads");

const router = express.Router();

async function canReadResume(user, publicPath) {
  const ownerSnap = await db.collection("uploads").doc(encodeURIComponent(publicPath)).get();
  if (ownerSnap.exists && ownerSnap.data().ownerId === user.id) return true;

  const field = user.role === "RECRUITER" ? "recruiterId" : "studentId";
  const appSnap = await db
    .collection("applications")
    .where("resumePath", "==", publicPath)
    .where(field, "==", user.id)
    .limit(1)
    .get();
  return !appSnap.empty;
}

router.get("/:kind/:filename", requireAuth, async (req, res) => {
  const file = parseUploadPath(`/uploads/${req.params.kind}/${req.params.filename}`);
  if (!file) return res.status(404).end();

  try {
    if (file.kind === "resumes" && !(await canReadResume(req.user, file.publicPath))) {
      return res.status(404).end();
    }
    if (!fs.existsSync(file.absolutePath)) return res.status(404).end();

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(file.absolutePath, { dotfiles: "deny" });
  } catch (err) {
    console.error("File access error:", err);
    return res.status(500).end();
  }
});

module.exports = router;
