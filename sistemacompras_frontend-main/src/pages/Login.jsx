import React, { useState } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import Loader from "../components/Loader.jsx";
import { API_URL } from "../services/config";

export default function Login() {
  const { user, login, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  if (!loading && user) {
    const to = location.state?.from?.pathname || "/";
    return <Navigate to={to} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor complete todos los campos.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error al iniciar sesion");
      }

      const userData =
        data.user || data.usuario || data.data?.user || data.data?.usuario;

      const tokenData =
        data.token || data.access_token || data.jwt || data.data?.token;

      if (!userData || !tokenData) {
        throw new Error("Login OK pero no llego user/token desde el backend.");
      }

      login(userData, tokenData);

      const to = location.state?.from?.pathname || "/";
      navigate(to, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {loading && <Loader />}

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Iniciar Sesion
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 font-semibold">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700">
              Correo electronico
            </label>
            <input
              type="email"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">
              Contrasena
            </label>
            <input
              type="password"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
