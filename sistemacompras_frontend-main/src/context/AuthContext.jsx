import { createContext, useContext, useEffect, useState } from "react";
import { normalizeUserRole } from "../utils/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Se ejecuta UNA sola vez al montar la app
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser) setUser(normalizeUserRole(JSON.parse(storedUser)));
      if (storedToken) setToken(storedToken);
    } catch (e) {
      console.error("Error leyendo sesión:", e);
      // si algo está corrupto, limpiamos
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, tokenData) => {
    const normalizedUser = normalizeUserRole(userData);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", tokenData);
    setUser(normalizedUser);
    setToken(tokenData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
}
