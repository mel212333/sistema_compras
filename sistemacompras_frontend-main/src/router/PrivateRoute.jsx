import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loader if preferred
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
