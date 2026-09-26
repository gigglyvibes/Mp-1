import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

/**
 * Guards nested routes behind authentication, optionally restricted
 * to a specific role (e.g. <ProtectedRoute role="business" />).
 */
const ProtectedRoute = ({ role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
