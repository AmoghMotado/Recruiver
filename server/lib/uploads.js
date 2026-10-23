// server/lib/uploads.js
// Uploaded files live under <project>/uploads/<kind>/<file>. They are never
// served statically: see server/routes/files.js for the access rules.
const path = require("path");

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const UPLOAD_KINDS = ["resumes", "job-descriptions"];
const UPLOAD_PATH_RE = /^\/uploads\/(resumes|job-descriptions)\/([A-Za-z0-9._-]+)$/;

// Validates a stored path like "/uploads/resumes/123.pdf" and returns its
// parts, or null when the value is not a well-formed upload path. This is the
// only way user-supplied paths may reach the file system.
function parseUploadPath(value) {
  if (typeof value !== "string") return null;
  const m = value.match(UPLOAD_PATH_RE);
  if (!m || m[2].includes("..")) return null;
  return {
    kind: m[1],
    filename: m[2],
    publicPath: value,
    absolutePath: path.join(UPLOAD_ROOT, m[1], m[2]),
  };
}

module.exports = { UPLOAD_ROOT, UPLOAD_KINDS, parseUploadPath };
