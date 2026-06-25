import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { canAccessPath } from "../utils/roles";

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessPath(user, location.pathname)) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-100 p-6">
          <div className="rounded border bg-white p-6 text-slate-700">
            No tenes permisos para acceder a esta vista.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
