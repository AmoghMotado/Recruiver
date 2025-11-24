// ============================================
// FILE: pages/api/forum/messages.js
// Forum API using Firebase Admin (same as server)
// ============================================

import { admin, db } from "../../../server/lib/firebaseAdmin"; // ✅ use existing Admin SDK

export default async function handler(req, res) {
  // CORS headers (for safety – Next API is same origin, but keep it)
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  /* ============ GET: Fetch messages ============ */
  if (req.method === "GET") {
    try {
      const messagesRef = db.collection("forumMessages");

      try {
        const snap = await messagesRef
          .orderBy("createdAt", "desc")
          .limit(100)
          .get();

        const messages = [];

        snap.forEach((doc) => {
          const data = doc.data() || {};
          messages.push({
            id: doc.id,
            content: data.content || "",
            authorId: data.authorId || "",
            authorName: data.authorName || "Anonymous",
            authorEmail: data.authorEmail || "",
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            likes: data.likes || 0,
          });
        });

        // oldest → newest for UI
        messages.reverse();

        return res.status(200).json({
          success: true,
          messages,
        });
      } catch (queryError) {
        console.log("Forum query error:", queryError.message);
        // If collection missing → just return empty list
        return res.status(200).json({
          success: true,
          messages: [],
        });
      }
    } catch (error) {
      console.error("Error fetching forum messages:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: error.message,
      });
    }
  }

  /* ============ POST: Create message ============ */
  if (req.method === "POST") {
    try {
      const { content, authorId, authorName, authorEmail } = req.body || {};

      if (!content || !content.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Message content is required" });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Message is too long (max 1000 characters)",
        });
      }

      const finalAuthorId = String(authorId || "anonymous");
      const finalAuthorName = String(
        authorName || authorEmail || "Anonymous User"
      );
      const finalAuthorEmail = String(authorEmail || "");

      const ts = admin.firestore.FieldValue.serverTimestamp();

      const messageData = {
        content: content.trim(),
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        authorEmail: finalAuthorEmail,
        createdAt: ts,
        updatedAt: ts,
        likes: 0,
      };

      const messagesRef = db.collection("forumMessages");
      const docRef = await messagesRef.add(messageData);

      // Return a client-friendly object
      const responseMessage = {
        id: docRef.id,
        content: content.trim(),
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        authorEmail: finalAuthorEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
        likes: 0,
      };

      return res.status(201).json({
        success: true,
        message: responseMessage,
      });
    } catch (error) {
      console.error("ERROR creating forum message:", error);

      let errorMsg = error.message || "Unknown error";
      if (error.code === "permission-denied") {
        errorMsg = "Permission denied. Check Firestore security rules.";
      } else if (error.code === "unauthenticated") {
        errorMsg = "Authentication required.";
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create message",
        error: errorMsg,
        code: error.code || "UNKNOWN",
      });
    }
  }

  // Anything else
  return res.status(405).json({
    success: false,
    message: "Method not allowed",
  });
}
