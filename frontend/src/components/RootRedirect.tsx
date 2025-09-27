import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RootRedirect() {
  const { isAuthenticated } = useAuth();

  // If authenticated, redirect to dashboard, otherwise to login
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}
