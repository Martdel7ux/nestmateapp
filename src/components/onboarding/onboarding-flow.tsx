import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/contexts/i18n-context";

const STORAGE_KEY = "nestmate-onboarded";

type Stage = "splash" | "language" | "done";

// ── Splash ──────────────────────────────────────────────────────────────────
function SplashStage({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundImage: "linear-gradient(160deg, #0f172a 0%, #0c3358 50%, #0f172a 100%)" } as React.CSSProperties}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
    >
      {/* Glowing ring */}
      <motion.div
        className="absolute h-[420px] w-[420px] rounded-full"
        style={{ backgroundImage: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)" } as React.CSSProperties}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      {/* Secondary shimmer ring */}
      <motion.div
        className="absolute h-[260px] w-[260px] rounded-full border border-sky-400/20"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: [0, 0.6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.75, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Logo image with glow */}
        <motion.div
          className="relative"
          animate={{ filter: ["drop-shadow(0 0 16px rgba(14,165,233,0.4))", "drop-shadow(0 0 32px rgba(14,165,233,0.7))", "drop-shadow(0 0 16px rgba(14,165,233,0.4))"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/logo-white.png"
            alt="NestMate"
            className="h-24 object-contain"
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-sm font-medium tracking-widest text-sky-300/80 uppercase"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Student accommodation re-imagined
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-sky-400/60"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Language selection ───────────────────────────────────────────────────────
function LanguageStage({ onDone }: { onDone: () => void }) {
  const { setLanguage } = useI18n();
  const [selected, setSelected] = useState<"en" | "el">("en");

  const handleContinue = () => {
    setLanguage(selected);
    localStorage.setItem(STORAGE_KEY, "true");
    onDone();
  };

  const options = [
    { code: "en" as const, flag: "🇬🇧", name: "English", sub: "Continue in English" },
    { code: "el" as const, flag: "🇬🇷", name: "Ελληνικά", sub: "Συνέχεια στα Ελληνικά" },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40, transition: { duration: 0.35 } }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Top gradient accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-sky-400 to-primary" />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Logo small */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <img src="/logo-blue.png" alt="NestMate" className="h-12 object-contain dark:hidden" />
          <img src="/logo-white.png" alt="NestMate" className="hidden h-12 object-contain dark:block" />
        </motion.div>

        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <h1 className="font-display text-3xl font-bold">Choose your language</h1>
          <p className="mt-2 text-sm text-muted-foreground">Επιλέξτε τη γλώσσα σας</p>
        </motion.div>

        {/* Language cards */}
        <div className="w-full max-w-sm space-y-3">
          {options.map(({ code, flag, name, sub }, i) => (
            <motion.button
              key={code}
              type="button"
              onClick={() => setSelected(code)}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.24 + i * 0.08 }}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                selected === code
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span className="text-4xl">{flag}</span>
              <div className="flex-1">
                <p className="text-base font-bold">{name}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              {/* Radio dot */}
              <div className={`h-5 w-5 rounded-full border-2 transition-all ${
                selected === code
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}>
                {selected === code && (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Continue button */}
        <motion.button
          type="button"
          onClick={handleContinue}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="mt-8 flex h-14 w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
        >
          Continue →
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Orchestrator ─────────────────────────────────────────────────────────────
export function OnboardingFlow({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>(() => {
    if (localStorage.getItem(STORAGE_KEY)) return "done";
    return "splash";
  });

  return (
    <>
      {stage === "done" && children}

      <AnimatePresence mode="wait">
        {stage === "splash" && (
          <SplashStage key="splash" onDone={() => setStage("language")} />
        )}
        {stage === "language" && (
          <LanguageStage key="language" onDone={() => setStage("done")} />
        )}
      </AnimatePresence>
    </>
  );
}
