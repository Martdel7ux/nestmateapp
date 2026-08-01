import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { IconHome } from "../icons";
import "../nm-theme.css";

type Mode = "signin" | "signup";

export function WelcomeScreen() {
  const { resolvedTheme } = useTheme();
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter your email and a password (min 6 characters).");
      return;
    }
    if (mode === "signup" && fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email.trim(), password);
        navigate("/");
      } else {
        await signUp({ email: email.trim(), password, fullName: fullName.trim(), userType: "student" });
        toast.success("Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: "var(--nm-r-md)",
    border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)",
    boxShadow: "var(--nm-elev)", fontSize: 16, color: "var(--nm-text)",
  };

  return (
    <div data-nm={resolvedTheme === "dark" ? "dark" : "light"} style={{ minHeight: "100dvh", background: "var(--nm-bg)", display: "flex", flexDirection: "column", padding: "calc(56px + env(safe-area-inset-top)) 26px calc(30px + env(safe-area-inset-bottom))" }}>
      {/* Brand */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 12 }}>
        <div style={{ width: 96, height: 96, borderRadius: 32, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
          <IconHome size={44} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.03em" }}>NestMate</div>
          <div style={{ fontSize: 14.5, color: "var(--nm-muted)", marginTop: 8 }}>Your whole student life, in one place.</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 6, background: "var(--nm-surface2)", borderRadius: 99, padding: 4, marginTop: 40 }}>
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 99, font: "600 13.5px Inter, sans-serif", background: mode === m ? "var(--nm-surface)" : "transparent", color: mode === m ? "var(--nm-text)" : "var(--nm-muted)", boxShadow: mode === m ? "var(--nm-elev)" : "none" }}>
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {mode === "signup" && (
          <input style={inputStyle} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
        )}
        <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void submit(); }} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
      </div>

      <button type="button" onClick={() => void submit()} disabled={busy} style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: 16, borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 16px Inter, sans-serif", marginTop: 18, opacity: busy ? 0.7 : 1 }}>
        {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--nm-line)" }} />
        <span style={{ fontSize: 12, color: "var(--nm-muted)" }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--nm-line)" }} />
      </div>

      <button type="button" onClick={() => void signInWithGoogle().catch((e) => toast.error(e instanceof Error ? e.message : "Google sign-in failed"))} style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: 15, borderRadius: "var(--nm-r-md)", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", font: "600 15px Inter, sans-serif", color: "var(--nm-text)" }}>
        Continue with Google
      </button>

      <div style={{ flex: 1 }} />
      <p style={{ fontSize: 11.5, color: "var(--nm-muted)", textAlign: "center", lineHeight: 1.6, marginTop: 24 }}>
        By continuing you agree to NestMate's Terms and Privacy Policy.
      </p>
    </div>
  );
}
