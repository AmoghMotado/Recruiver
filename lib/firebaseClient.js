// lib/firebaseClient.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const db = getFirestore(app);
export default app;
