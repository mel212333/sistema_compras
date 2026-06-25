import { useState, useCallback } from "react";
import { API_URL } from "../services/config";

export default function useAuth() {
  
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // LOGIN
  // ---------------------------
  const login = useCallback(async (email, password) => {
    setLoading(true);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      throw new Error(data.error || "Error al iniciar sesión");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.usuario));

    setUser(data.usuario);
    setToken(data.token);
    setLoading(false);
  }, []);

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user, // 👈 CLAVE
  };
}
