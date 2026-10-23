// pages/api/forum/messages.js
// Community forum for signed-in users. The author is always the session user;
// email addresses are never returned to other users.

import { admin, db } from "../../../server/lib/firebaseAdmin";
import { withAuth } from "../../../server/lib/session";

const MAX_LENGTH = 1000;

function toClient(id, data) {
  return {
    id,
    content: data.content || "",
    authorId: data.authorId || "",
    authorName: data.authorName || "Member",
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    likes: data.likes || 0,
  };
}

async function displayNameFor(userId) {
  const snap = await db.collection("users").doc(userId).get();
  const u = snap.exists ? snap.data() : {};
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || "Member";
}

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const snap = await db
        .collection("forumMessages")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

      const messages = snap.docs.map((doc) => toClient(doc.id, doc.data() || {}));
      messages.reverse(); // oldest → newest for the UI

      return res.status(200).json({ success: true, messages });
    } catch (error) {
      console.error("Error fetching forum messages:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
  }

  if (req.method === "POST") {
    try {
      const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";

      if (!content) {
        return res.status(400).json({ success: false, message: "Message content is required" });
      }
      if (content.length > MAX_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Message is too long (max ${MAX_LENGTH} characters)`,
        });
      }

      const ts = admin.firestore.FieldValue.serverTimestamp();
      const messageData = {
        content,
        authorId: req.user.id,
        authorName: await displayNameFor(req.user.id),
        createdAt: ts,
        updatedAt: ts,
        likes: 0,
      };

      const docRef = await db.collection("forumMessages").add(messageData);

      return res.status(201).json({
        success: true,
        // Server timestamps are not resolved yet; toClient falls back to now
        message: toClient(docRef.id, { ...messageData, createdAt: null, updatedAt: null }),
      });
    } catch (error) {
      console.error("Error creating forum message:", error);
      return res.status(500).json({ success: false, message: "Failed to create message" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default withAuth(handler);
