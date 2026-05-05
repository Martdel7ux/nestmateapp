import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate("/", { replace: true });
      return;
    }

    // Supabase detects the code/token in the URL and exchanges it automatically.
    // Listen for the resulting SIGNED_IN event and redirect into the app.
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        navigate("/", { replace: true });
      }
    });

    // Fallback: if no event fires within 4 s, go home anyway
    const fallback = window.setTimeout(() => navigate("/", { replace: true }), 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}
