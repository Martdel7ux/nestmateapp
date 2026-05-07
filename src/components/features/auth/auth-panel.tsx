import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Logo } from "@/components/ui/logo";
import { GdprSplash } from "@/components/features/auth/gdpr-splash";
import type { UserType } from "@/types/supabase";

const GDPR_KEY = "nestmate_gdpr_accepted";

type Mode = "signup" | "login" | "reset" | "gdpr";

function IconInput({
  icon: Icon,
  rightIcon,
  onRightClick,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  rightIcon?: React.ElementType;
  onRightClick?: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-14 w-full rounded-2xl border border-border bg-white/80 pl-11 pr-11 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-card/80"
          {...props}
        />
        {rightIcon && (() => {
          const RightIcon = rightIcon;
          return (
            <button
              type="button"
              onClick={onRightClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              <RightIcon size={16} />
            </button>
          );
        })()}
      </div>
      {error && <p className="pl-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("student");
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  const { signInWithPassword, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleLogin = async () => {
    const errors: Record<string, string> = {};
    if (!isEmail(loginEmail)) errors.email = t("authEmailError");
    if (!loginPassword) errors.password = t("authPasswordError");
    if (Object.keys(errors).length > 0) { setLoginErrors(errors); return; }
    setLoginErrors({});
    setSubmitting(true);
    try {
      await signInWithPassword(loginEmail.trim(), loginPassword);
      toast.success(t("authWelcomeBack"));
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("authSignInFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async () => {
    const errors: Record<string, string> = {};
    if (fullName.trim().length < 2) errors.fullName = t("authNameError");
    if (!isEmail(signupEmail)) errors.email = t("authEmailError");
    if (signupPassword.length < 6) errors.password = t("authPasswordShort");
    if (!confirmPassword) errors.confirmPassword = t("authConfirmPwError");
    else if (signupPassword !== confirmPassword) errors.confirmPassword = t("authPasswordMatch");
    if (Object.keys(errors).length > 0) { setSignupErrors(errors); return; }
    setSignupErrors({});
    setSubmitting(true);
    try {
      await signUp({ email: signupEmail.trim(), password: signupPassword, fullName: fullName.trim(), userType });
      toast.success("Account created! Check your inbox to verify your email.");
      setLoginEmail(signupEmail.trim());
      setMode("login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    const errors: Record<string, string> = {};
    if (!isEmail(resetEmail)) errors.email = t("authEmailError");
    if (Object.keys(errors).length > 0) { setResetErrors(errors); return; }
    setResetErrors({});
    setSubmitting(true);
    try {
      await resetPassword(resetEmail.trim());
      toast.success("Reset link sent — check your inbox.");
      setMode("login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  // Show GDPR splash when a new user tries to sign up
  if (mode === "gdpr") {
    return (
      <GdprSplash
        onAccept={() => {
          localStorage.setItem(GDPR_KEY, "true");
          setMode("signup");
        }}
        onDecline={() => {
          setMode("login");
        }}
      />
    );
  }

  const heading = mode === "reset" ? `${t("authResetTitle")} 🔑` : "Hello there 👋";
  const subheading =
    mode === "login"
      ? "Please enter your email & password to access your account"
      : mode === "signup"
      ? "Create your NestMate account to get started"
      : t("authResetDesc");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/30 via-primary/5 to-background">
      {mode !== "login" && (
        <button
          type="button"
          onClick={() => setMode("login")}
          className="m-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur transition hover:bg-white"
        >
          ←
        </button>
      )}
      {mode === "login" && <div className="h-8" />}

      <div className="px-7 pb-4">
        <Logo className="h-20" />
      </div>

      <div className="px-7 pb-8">
        <h1 className="font-display text-4xl font-bold">{heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subheading}</p>
      </div>

      <div className="flex-1 rounded-t-[2.5rem] bg-background px-6 pt-8 shadow-card">

        {/* ── LOGIN ── */}
        {mode === "login" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authEmailLabel")}</label>
              <IconInput
                icon={Mail}
                type="email"
                placeholder={t("authEmailPh")}
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                error={loginErrors.email}
              />
            </div>
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authPasswordLabel")}</label>
              <IconInput
                icon={Lock}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                rightIcon={showPw ? EyeOff : Eye}
                onRightClick={() => setShowPw(!showPw)}
                error={loginErrors.password}
              />
            </div>

            <div className="flex items-center justify-end">
              <button type="button" onClick={() => setMode("reset")} className="text-sm font-medium text-primary hover:underline">
                {t("authForgotPassword")}
              </button>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleLogin}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : t("authSignIn")}
            </button>

            <div className="relative flex items-center gap-3 py-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {t("authOrContinueWith")} <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleButton label={t("authContinueGoogle")} onClick={handleGoogle} />

            <p className="pt-2 text-center text-sm text-muted-foreground">
              {t("authNoAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  const alreadyAccepted = localStorage.getItem(GDPR_KEY) === "true";
                  setMode(alreadyAccepted ? "signup" : "gdpr");
                }}
                className="font-semibold text-primary hover:underline"
              >
                {t("authSignUp")}
              </button>
            </p>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {mode === "signup" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authFullName")}</label>
              <IconInput
                icon={User}
                type="text"
                placeholder={t("authFullNamePh")}
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={signupErrors.fullName}
              />
            </div>
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authEmailLabel")}</label>
              <IconInput
                icon={Mail}
                type="email"
                placeholder={t("authEmailPh")}
                autoComplete="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                error={signupErrors.email}
              />
            </div>
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authPasswordLabel")}</label>
              <IconInput
                icon={Lock}
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                rightIcon={showPw ? EyeOff : Eye}
                onRightClick={() => setShowPw(!showPw)}
                error={signupErrors.password}
              />
            </div>
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authConfirmPassword")}</label>
              <IconInput
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                placeholder={t("authConfirmPwPh")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                rightIcon={showConfirm ? EyeOff : Eye}
                onRightClick={() => setShowConfirm(!showConfirm)}
                error={signupErrors.confirmPassword}
              />
            </div>

            <div className="flex gap-3">
              {(["student", "landlord"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`flex-1 rounded-2xl border-2 py-3 text-sm font-semibold capitalize transition-all ${
                    userType === type
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {type === "student" ? `🎓 ${t("authStudent")}` : `🏠 ${t("authLandlord")}`}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSignup}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : t("authSignUp")}
            </button>

            <div className="relative flex items-center gap-3 py-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {t("authOrContinueWith")} <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleButton label={t("authContinueGoogle")} onClick={handleGoogle} />

            <p className="pt-2 text-center text-sm text-muted-foreground">
              {t("authHaveAccount")}{" "}
              <button type="button" onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
                {t("authSignIn")}
              </button>
            </p>
          </div>
        )}

        {/* ── RESET ── */}
        {mode === "reset" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="pl-1 text-sm font-medium">{t("authEmailLabel")}</label>
              <IconInput
                icon={Mail}
                type="email"
                placeholder={t("authEmailPh")}
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                error={resetErrors.email}
              />
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleReset}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : t("authSendReset")}
            </button>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}

function GoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white/60 text-sm font-semibold shadow-sm transition hover:bg-white active:scale-[0.98] dark:bg-card/60 dark:hover:bg-card"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {label}
    </button>
  );
}
