import { Navigate } from "react-router-dom";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { useAuth } from "@/contexts/auth-context";

export function AuthPage() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;
  return <AuthPanel />;
}
