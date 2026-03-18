import { Navigate } from "react-router-dom";

import { useAuth } from "../components/AuthContext";

export async function LogoutPage() {
  const { logout } = useAuth();
  await logout();
  return <Navigate to="/login?lc=true" />;
}