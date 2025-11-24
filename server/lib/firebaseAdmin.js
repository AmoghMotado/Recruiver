// server/lib/firebaseAdmin.js
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Only initialize if not already initialized
if (!admin.apps.length) {
  try {
    // Try both possible filenames
    let serviceAccountPath = path.join(
      process.cwd(),
      "firebase-service-account.json"
    );

    if (!fs.existsSync(serviceAccountPath)) {
      serviceAccountPath = path.join(
        process.cwd(),
        "firebaseServiceAccount.json"
      );
    }

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      console.log("✅ Firebase Admin initialised with service account");
      console.log("📁 Loaded from:", serviceAccountPath);
    } else {
      // No service account found
      console.log("⚠️ Service account file not found. Checked:");
      console.log("   - firebase-service-account.json");
      console.log("   - firebaseServiceAccount.json");

      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "recruiver",
      });

      console.log(
        "✅ Firebase Admin initialized without service account (limited functionality)"
      );
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error.message);

    // Last resort fallback
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "recruiver",
      });
      console.log("✅ Firebase Admin initialized with fallback config");
    }
  }
}

// ---- EXPORTS ----
const db = admin.firestore();

// IMPORTANT FIX: create the Storage *instance*, not the function
const storage = admin.storage(); // <— this is what gives you .bucket()

module.exports = {
  admin,
  db,
  storage,
};
