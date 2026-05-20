import { Link } from "react-router-dom";
import {
  MapPin, UsersRound, BookOpen, Bus, Sparkles,
  KeyRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { AppHeader } from "@/components/layout/app-header";
import { LandlordHome } from "@/components/features/landlord/landlord-home";
import { UpcomingEvents } from "@/components/features/home/UpcomingEvents";
import { ExpiringSoonStrip } from "@/components/features/documents/ExpiringSoonStrip";
import { LocationConfirmationBanner } from "@/components/features/location/LocationConfirmationBanner";

// ── Page ──────────────────────────────────────────────────────────────────────

export function HomePage() {
  const { snapshot } = useData();
  const reduced      = useReducedMotion();

  if (snapshot.profile.user_type === "landlord") return <LandlordHome />;

  const firstName = snapshot.profile.full_name?.split(" ")[0] ?? "there";
  const hour      = new Date().getHours();
  const greeting  =
    hour >= 5 && hour < 12 ? "Good morning" :
    hour >= 12 && hour < 18 ? "Good afternoon" :
    "Good evening";
  const userCity  = snapshot.profile.city;


  return (
    <div className="relative min-h-dvh [overflow-x:clip]">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute -left-[20%] -top-[10%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-primary)" }} />
        <div className="absolute -right-[15%] top-[18%] h-[44vh] w-[44vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-secondary)" }} />
        <div className="absolute bottom-[8%] left-[5%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-accent)" }} />
        <div className="bg-noise absolute inset-0" style={{ opacity: "var(--grain-opacity)" }} />
      </div>

      {/* Sticky header */}
      <AppHeader variant="home" title="" right={{ type: "notifications" }} />

      {/* Blur veil below header */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[39]"
        style={{
          height: "calc(72px + env(safe-area-inset-top))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
        }} />

      <div className="space-y-6 px-5 pb-32 pt-4">

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{greeting}</p>
          <h1 className="text-[30px] font-light leading-[1.15] tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          {userCity && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <MapPin size={10} />
              <span>{userCity}, Cyprus</span>
            </div>
          )}
        </motion.div>

        {/* ── Hero card — property search ── */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <Link
            to="/properties"
            className="block relative overflow-hidden rounded-[24px] p-6 active:scale-[0.98] transition-transform"
            style={{ background: "var(--action-property)", minHeight: "156px" }}
          >
            {/* Glow blob */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative flex flex-col justify-between h-full">
              <div>
                <p className="text-white/70 text-[12px] font-medium mb-1 uppercase tracking-wider">
                  Find your place
                </p>
                <h2 className="text-white text-[22px] font-semibold leading-snug">
                  200+ properties<br />in Nicosia
                </h2>
              </div>
              <div className="mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                  <KeyRound size={14} />
                  Browse properties
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* ── Quick access 2×2 ── */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          <p className="mb-3 text-[14px] font-semibold text-foreground">Quick access</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Flatmates — green */}
            <motion.div whileTap={reduced ? undefined : { scale: 0.96 }} transition={{ duration: 0.1 }}>
              <Link to="/flatmates" className="flex flex-col items-center text-center rounded-[20px] p-5 shadow-sm active:brightness-95 transition-[filter]"
                style={{ background: "linear-gradient(135deg, #97C459 0%, #639922 100%)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm mb-2.5">
                  <UsersRound size={22} strokeWidth={2} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white">Flatmates</span>
              </Link>
            </motion.div>

            {/* Nestmate AI — purple */}
            <motion.div whileTap={reduced ? undefined : { scale: 0.96 }} transition={{ duration: 0.1 }}>
              <Link to="/assistant" className="flex flex-col items-center text-center rounded-[20px] p-5 shadow-sm active:brightness-95 transition-[filter]"
                style={{ background: "linear-gradient(135deg, #AFA9EC 0%, #7F77DD 100%)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm mb-2.5">
                  <Sparkles size={22} strokeWidth={2} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white">Nestmate AI</span>
              </Link>
            </motion.div>

            {/* Study Hub — teal */}
            <motion.div whileTap={reduced ? undefined : { scale: 0.96 }} transition={{ duration: 0.1 }}>
              <Link to="/study" className="flex flex-col items-center text-center rounded-[20px] p-5 shadow-sm active:brightness-95 transition-[filter]"
                style={{ background: "linear-gradient(135deg, #5DCAA5 0%, #1D9E75 100%)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm mb-2.5">
                  <BookOpen size={22} strokeWidth={2} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white">Study Hub</span>
              </Link>
            </motion.div>

            {/* Buses — blue */}
            <motion.div whileTap={reduced ? undefined : { scale: 0.96 }} transition={{ duration: 0.1 }}>
              <Link to="/tools/buses" className="flex flex-col items-center text-center rounded-[20px] p-5 shadow-sm active:brightness-95 transition-[filter]"
                style={{ background: "linear-gradient(135deg, #85B7EB 0%, #378ADD 100%)" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm mb-2.5">
                  <Bus size={22} strokeWidth={2} className="text-white" />
                </div>
                <span className="text-sm font-medium text-white">Buses</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Location confirmation banner ── */}
        <LocationConfirmationBanner />

        {/* ── Expiring documents strip ── */}
        <ExpiringSoonStrip />

        {/* ── Upcoming Events ── */}
        <UpcomingEvents />

      </div>
    </div>
  );
}
