import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Landing page for the password-reset email link.
 *
 * The reset email redirects here with a recovery code in the URL. The Supabase
 * client (detectSessionInUrl) exchanges it into a temporary recovery session
 * and fires PASSWORD_RECOVERY. Once that session exists the user can set a new
 * password via updateUser().
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setReady(true);
        setChecking(false);
      }
    });

    // The code may already be exchanged by the time we mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    // Stop the spinner even if no recovery event arrives (invalid/expired link).
    const fallback = window.setTimeout(() => setChecking(false), 5000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(fallback);
    };
  }, []);

  const handleSubmit = async () => {
    if (!supabase) return;
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password updated — you're now signed in");
      navigate("/", { replace: true });
    } catch (e) {
      // Surface the real reason (length policy, reused password, expired link…).
      toast.error(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm space-y-5 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <ShieldCheck size={28} />
        </div>

        {checking ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
          </div>
        ) : ready ? (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
              <p className="text-sm text-muted-foreground">
                Choose a new password for your NestMate account.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="New password (min 6 chars)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
              />
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving ? "Updating…" : "Update password"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Reset link invalid</h1>
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one
                from the sign-in screen.
              </p>
            </div>
            <Button onClick={() => navigate("/auth", { replace: true })} className="w-full">
              Back to sign in
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
