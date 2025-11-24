// lib/firebaseClient.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// âš ï¸ Using your existing config exactly as-is
const firebaseConfig = {
  apiKey: "AIzaSyBDp6Gans9sbZftxQEwdWJl4vbUKlUblCY",
  authDomain: "recruiver.firebaseapp.com",
  projectId: "recruiver",
  storageBucket: "recruiver.firebasestorage.app",
  messagingSenderId: "954901963836",
  appId: "1:954901963836:web:c5590e9381d71ae6d4cf39",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// --- Client-side singletons ---
// These exports only *add* functionality, they don't break existing imports.
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Keep user logged in across refreshes in the browser.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  // Avoid noisy logs in production, but still useful in dev.
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.error("Failed to set Firebase auth persistence", err);
  }
});

export const db = getFirestore(app);

// Default export remains the Firebase app (unchanged)
export default app;