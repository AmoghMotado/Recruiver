// context/AuthContext.js
// The signed-in user, as reported by the server session (/api/auth/me).
import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext({ user: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = res.ok ? await res.json() : null;
      setUser(data && data.user ? data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
