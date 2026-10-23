// pages/api/mock-interview/upload-url.js
// Issues a short-lived signed URL so the browser can upload its recording
// straight to Cloud Storage without the bucket being publicly writable.
import { randomUUID } from "crypto";
import { db, storage } from "../../../server/lib/firebaseAdmin";
import { withAuth } from "../../../server/lib/session";

const ALLOWED_TYPES = ["video/webm", "video/mp4"];
const MAX_BYTES = 200 * 1024 * 1024;

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { interviewId, contentType, size } = req.body || {};
  const type = String(contentType || "").split(";")[0];

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({ error: "Unsupported video format" });
  }
  if (Number(size) > MAX_BYTES) {
    return res.status(413).json({ error: "Recording is too large" });
  }

  try {
    const sessionSnap = await db.collection("mockInterviews").doc(String(interviewId || "")).get();
    if (!sessionSnap.exists || sessionSnap.data().userId !== req.user.id) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const ext = type === "video/mp4" ? "mp4" : "webm";
    const filePath = `mock-interviews/${req.user.id}/${interviewId}-${randomUUID()}.${ext}`;
    const [uploadUrl] = await storage
      .bucket()
      .file(filePath)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000,
        contentType: type,
      });

    return res.status(200).json({ uploadUrl, filePath, contentType: type });
  } catch (err) {
    console.error("[mock-interview/upload-url] Error:", err);
    return res.status(500).json({ error: "Could not prepare the upload" });
  }
}

export default withAuth(handler, { roles: ["CANDIDATE"] });
