import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Home from "../pages/Home";
import RequerimientosList from "../pages/RequerimientosList";
import Perfil from "../pages/Perfil";
import Compras from "../pages/Compras";
import Deposito from "../pages/Deposito";
import UsuariosAdmin from "../pages/UsuariosAdmin";
import ComparativaPrecios from "../pages/ComparativaPrecios";
import CalificacionesProveedores from "../pages/CalificacionesProveedores";

export default function AppRouter() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Privadas (todas adentro del ProtectedRoute con Outlet) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/requerimientos" element={<RequerimientosList />} />
        <Route path="/requerimientos/:id/comparativa" element={<ComparativaPrecios />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/deposito" element={<Deposito />} />
        <Route path="/calificaciones" element={<CalificacionesProveedores />} />
        <Route path="/usuarios" element={<UsuariosAdmin />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
