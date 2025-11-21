// lib/firebaseAdmin.js
import admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("Missing Firebase admin environment variables");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
