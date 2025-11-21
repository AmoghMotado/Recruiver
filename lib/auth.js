// lib/auth.js
import { useEffect, useState, useContext, createContext } from "react";
import { auth, googleProvider } from "./firebaseClient";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginEmail = (email, pass) =>
    signInWithEmailAndPassword(auth, email, pass);

  const registerEmail = (email, pass) =>
    createUserWithEmailAndPassword(auth, email, pass);

  const loginGoogle = () => signInWithPopup(auth, googleProvider);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
