// pages/api/profile/candidate.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
let db;

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}")),
  });
}

db = getFirestore();

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Fetch profile by email
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const usersRef = db.collection("users");
      const userSnap = await usersRef.where("email", "==", email).limit(1).get();

      if (userSnap.empty) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const userData = userSnap.docs[0].data();
      const userId = userSnap.docs[0].id;

      // Fetch candidate profile
      const candidateRef = db.collection("candidates").doc(userId);
      const candidateSnap = await candidateRef.get();
      const candidateData = candidateSnap.exists ? candidateSnap.data() : {};

      return res.status(200).json({
        user: userData,
        candidate: candidateData,
      });
    }

    if (req.method === "POST") {
      // Save profile
      const { userId, email, user: userData, candidate: candidateData } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Update or create user document
      const usersRef = db.collection("users");
      const userQuery = await usersRef.where("email", "==", email).limit(1).get();

      let docId;
      if (!userQuery.empty) {
        docId = userQuery.docs[0].id;
        await usersRef.doc(docId).update({
          ...userData,
          updatedAt: new Date(),
        });
      } else {
        const newUserRef = await usersRef.add({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        docId = newUserRef.id;
      }

      // Update or create candidate profile
      const candidateRef = db.collection("candidates").doc(docId);
      await candidateRef.set(
        {
          ...candidateData,
          email: email,
          userId: docId,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return res.status(200).json({
        message: "Profile saved successfully",
        userId: docId,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}