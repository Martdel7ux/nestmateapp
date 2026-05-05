import { Navigate } from "react-router-dom";
import { AuthPanel } from "@/components/features/auth/auth-panel";
import { useAuth } from "@/contexts/auth-context";

export function AuthPage() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="container flex min-h-screen items-center py-10">
      <AuthPanel />
    </div>
  );
}
