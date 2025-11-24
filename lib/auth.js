// lib/auth.js
import { useEffect, useState, useContext, createContext } from "react";
import { auth } from "@/firebase/config";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} from "firebase/auth";

const AuthContext = createContext(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (isMounted) {
        setUser(u || null);
        setLoading(false);
        console.log("[AuthProvider] Auth state changed:", u?.uid || "logged out");
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginEmail = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[AuthProvider] Email login successful:", result.user.uid);
      return result;
    } catch (err) {
      setError(err.message);
      console.error("[AuthProvider] Email login failed:", err);
      throw err;
    }
  };

  const registerEmail = async (email, password) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[AuthProvider] Email registration successful:", result.user.uid);
      return result;
    } catch (err) {
      setError(err.message);
      console.error("[AuthProvider] Email registration failed:", err);
      throw err;
    }
  };

  const loginGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[AuthProvider] Google login successful:", result.user.uid);
      return result;
    } catch (err) {
      setError(err.message);
      console.error("[AuthProvider] Google login failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      console.log("[AuthProvider] Logout successful");
    } catch (err) {
      setError(err.message);
      console.error("[AuthProvider] Logout failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
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
  const context = useContext(AuthContext);
  if (!context) {
    console.warn(
      "[useAuth] Called outside AuthProvider. Make sure to wrap your app with <AuthProvider>"
    );
    return null;
  }
  return context;
}