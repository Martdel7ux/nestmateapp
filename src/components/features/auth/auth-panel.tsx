import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { userTypes } from "@/lib/constants";

// Separate schemas per mode so validation is always correct
const signupSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  userType: z.enum(userTypes)
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

const resetSchema = z.object({
  email: z.string().email("Enter a valid email address")
});

type SignupValues = z.infer<typeof signupSchema>;
type LoginValues = z.infer<typeof loginSchema>;
type ResetValues = z.infer<typeof resetSchema>;

type Mode = "signup" | "login" | "reset";

export function AuthPanel() {
  const [mode, setMode] = useState<Mode>("signup");
  const [submitting, setSubmitting] = useState(false);
  const { signInWithPassword, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", userType: "student" }
  });

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" }
  });

  const handleSignup = signupForm.handleSubmit(async (values: SignupValues) => {
    setSubmitting(true);
    try {
      await signUp({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        userType: values.userType
      });
      toast.success("Account created! Check your inbox to verify your email, then sign in.");
      setMode("login");
      loginForm.setValue("email", values.email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  });

  const handleLogin = loginForm.handleSubmit(async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await signInWithPassword(values.email, values.password);
      toast.success("Welcome back to NestMate!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  });

  const handleReset = resetForm.handleSubmit(async (values: ResetValues) => {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      toast.success("Password reset email sent. Check your inbox.");
      setMode("login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setSubmitting(false);
    }
  });

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Google sign-in is not configured yet. Please use email and password."
      );
    }
  };

  return (
    <Card className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
      {/* Left — branding */}
      <div className="space-y-5">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          <ShieldCheck size={14} />
          Verified student housing
        </div>
        <div className="space-y-3">
          <CardTitle className="text-3xl md:text-4xl">
            Move from search to signed lease with less stress
          </CardTitle>
          <CardDescription className="max-w-xl text-base">
            Email verification, landlord trust signals, flatmate discovery, and real-time
            chat designed specifically for students in Cyprus.
          </CardDescription>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Natural-language property search",
            "Tinder-style flatmate compatibility",
            "Realtime messaging with translation",
            "Admin moderation and landlord checks"
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl bg-muted/60 p-4 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="rounded-[2rem] border border-white/10 bg-background/70 p-5 shadow-card">
        {/* Tabs */}
        {mode !== "reset" && (
          <div className="mb-6 flex rounded-2xl bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-xl py-2 transition ${
                mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-xl py-2 transition ${
                mode === "login"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
          </div>
        )}

        {/* ── SIGN UP ── */}
        {mode === "signup" && (
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input
                {...signupForm.register("fullName")}
                placeholder="Maria Georgiou"
                autoComplete="name"
              />
              {signupForm.formState.errors.fullName && (
                <p className="text-xs text-destructive">
                  {signupForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...signupForm.register("email")}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
              {signupForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                {...signupForm.register("password")}
                placeholder="At least 6 characters"
                type="password"
                autoComplete="new-password"
              />
              {signupForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">I am joining as</label>
              <Select {...signupForm.register("userType")}>
                <option value="student">Student</option>
                <option value="landlord">Landlord / Property owner</option>
              </Select>
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Create account
            </Button>

            <div className="relative my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>
        )}

        {/* ── SIGN IN ── */}
        {mode === "login" && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...loginForm.register("email")}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
              {loginForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                {...loginForm.register("password")}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Sign in
            </Button>

            <div className="relative my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            <button
              type="button"
              onClick={() => setMode("reset")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </button>
          </form>
        )}

        {/* ── RESET PASSWORD ── */}
        {mode === "reset" && (
          <form className="space-y-4" onSubmit={handleReset}>
            <div className="mb-4 space-y-1">
              <h2 className="font-display text-2xl">Reset password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                {...resetForm.register("email")}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
              />
              {resetForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {resetForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Send reset email
            </Button>

            <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to sign in
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}
