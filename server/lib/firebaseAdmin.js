// server/lib/firebaseAdmin.js
const admin = require('firebase-admin');
const path = require('path');

// Path to the service account JSON you saved in /server
const serviceAccountPath = path.join(__dirname, '..', 'firebaseServiceAccount.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Firestore instance
const db = admin.firestore();

module.exports = { admin, db };
