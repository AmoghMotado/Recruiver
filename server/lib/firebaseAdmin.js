// server/lib/firebaseAdmin.js
// The single Firebase Admin instance used by Express routes and Next.js API routes.
//
// Credentials, first match wins:
//   1. FIREBASE_SERVICE_ACCOUNT_JSON  – the whole service account JSON in one env var
//   2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//   3. firebase-service-account.json / firebaseServiceAccount.json in the project root (local dev)
//   4. Application Default Credentials (Cloud Run, GCE, `gcloud auth application-default login`)
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function loadCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  for (const name of ["firebase-service-account.json", "firebaseServiceAccount.json"]) {
    const file = path.join(process.cwd(), name);
    if (fs.existsSync(file)) {
      return admin.credential.cert(JSON.parse(fs.readFileSync(file, "utf8")));
    }
  }

  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: loadCredential(),
    projectId:
      process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const storage = admin.storage();

module.exports = {
  admin,
  db,
  storage,
};
