import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export function WelcomeSplash() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  useEffect(() => {
    const t = setTimeout(() => navigate("/onboarding/intro", { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--bg-base)]">
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute -left-[20%] -top-[10%] h-[55vh] w-[55vh] rounded-full blur-[100px]"
          style={{ background: "var(--ambient-primary)" }} />
        <div className="absolute -right-[10%] top-[20%] h-[50vh] w-[50vh] rounded-full blur-[100px]"
          style={{ background: "var(--ambient-secondary)" }} />
        <div className="absolute bottom-[5%] left-[5%] h-[45vh] w-[45vh] rounded-full blur-[100px]"
          style={{ background: "var(--ambient-accent)" }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8"
      >
        <img src="/logo-blue.png" alt="NestMate" className="h-16 object-contain dark:hidden" />
        <img src="/logo-white.png" alt="NestMate" className="hidden h-16 object-contain dark:block" />
      </motion.div>

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center px-6"
      >
        <h1 className="text-[32px] font-light leading-snug tracking-tight text-foreground">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Let's get you set up. It only takes a minute.
        </p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-16 flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/50"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </div>
  );
}
