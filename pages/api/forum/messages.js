// ============================================
// FILE: pages/api/forum/messages.js
// ============================================
import { db, Timestamp } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

export default async function handler(req, res) {
  // Set CORS headers
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

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // GET: Fetch all messages
  if (req.method === "GET") {
    try {
      const messagesRef = collection(db, "forumMessages");

      try {
        const q = query(messagesRef, orderBy("createdAt", "desc"), limit(100));

        const querySnapshot = await getDocs(q);
        const messages = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
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

        // Reverse to show oldest first
        messages.reverse();

        return res.status(200).json({
          messages,
          success: true,
        });
      } catch (queryError) {
        console.log("Query error:", queryError.message);
        // Return empty array if collection doesn't exist
        return res.status(200).json({
          messages: [],
          success: true,
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({
        message: "Failed to fetch messages",
        error: error.message,
        success: false,
      });
    }
  }

  // POST: Create new message
  if (req.method === "POST") {
    try {
      console.log("=== RECEIVED POST REQUEST ===");
      console.log("Request body:", req.body);

      const { content, authorId, authorName, authorEmail } = req.body;

      // Validate input
      if (!content || !content.trim()) {
        return res.status(400).json({
          message: "Message content is required",
          success: false,
        });
      }

      if (content.trim().length > 1000) {
        return res.status(400).json({
          message: "Message is too long (max 1000 characters)",
          success: false,
        });
      }

      const finalAuthorId = String(authorId || "anonymous");
      const finalAuthorName = String(authorName || "Anonymous");
      const finalAuthorEmail = String(authorEmail || "");

      console.log("Validated data:", {
        content: content.trim(),
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        authorEmail: finalAuthorEmail,
      });

      // Prepare message data
      const messageData = {
        content: content.trim(),
        authorId: finalAuthorId,
        authorName: finalAuthorName,
        authorEmail: finalAuthorEmail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        likes: 0,
      };

      console.log("Attempting to add to Firestore:", messageData);

      // Add to Firestore
      const messagesRef = collection(db, "forumMessages");
      const docRef = await addDoc(messagesRef, messageData);

      console.log("Success! Message saved with ID:", docRef.id);

      // Return response
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
        message: responseMessage,
        success: true,
      });
    } catch (error) {
      console.error("ERROR creating message:", error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Return specific error based on error type
      let errorMsg = error.message;

      if (error.code === "permission-denied") {
        errorMsg =
          "Permission denied. Check Firestore security rules.";
      } else if (error.code === "unauthenticated") {
        errorMsg = "Authentication required.";
      } else if (error.message && error.message.includes("offline")) {
        errorMsg = "You appear to be offline.";
      }

      return res.status(500).json({
        message: "Failed to create message",
        error: errorMsg,
        code: error.code || "UNKNOWN",
        success: false,
      });
    }
  }

  return res.status(405).json({
    message: "Method not allowed",
    success: false,
  });
}