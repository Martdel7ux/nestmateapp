import React from "react";
import { Link } from "react-router-dom";
import { Bell, BookOpen, Bot, Building2, HeartHandshake, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { LandlordHome } from "@/components/features/landlord/landlord-home";
import { UpcomingEvents } from "@/components/features/home/UpcomingEvents";
import type { Property } from "@/types/supabase";

// ── Mini preview components ───────────────────────────────────────────────

function FlatmatesPreview() {
  const reduced = useReducedMotion();
  const colors = ["bg-sky-400", "bg-violet-400", "bg-emerald-400"];
  return (
    <div className="mb-3 flex h-14 items-center">
      <div className="flex -space-x-3">
        {colors.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className={`h-10 w-10 rounded-full ring-2 ring-background ${c} flex items-center justify-center text-white text-xs font-bold`}
          >
            {String.fromCharCode(65 + i)}
          </motion.div>
        ))}
        {!reduced && (
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            className="h-10 w-10 rounded-full ring-2 ring-dashed ring-sky-400/50 flex items-center justify-center"
          >
            <span className="text-sky-500 dark:text-sky-400 text-base font-bold">+</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function AIPreview() {
  const reduced = useReducedMotion();
  return (
    <div className="mb-3 flex h-14 items-end">
      <div className="glass rounded-2xl rounded-bl-sm px-3 py-2 text-[11px] font-medium max-w-[90%]">
        {!reduced ? (
          <span className="flex items-center gap-1">
            {[0, 0.25, 0.5].map((delay, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, delay, ease: "easeInOut" }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400"
              />
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">Ask me anything…</span>
        )}
      </div>
    </div>
  );
}

function PropertyPreview({ properties }: { properties: Property[] }) {
  const display = properties.slice(0, 3);
  return (
    <div className="mb-3 flex h-14 items-center gap-1.5">
      {display.length > 0 ? (
        display.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.28 }}
            className="h-12 flex-1 overflow-hidden rounded-xl"
          >
            {p.image_urls[0] ? (
              <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                <Building2 size={14} className="text-primary/60" />
              </div>
            )}
          </motion.div>
        ))
      ) : (
        <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary/10">
          <Building2 size={18} className="text-primary/50" />
        </div>
      )}
    </div>
  );
}

function StudyPreview() {
  const notes = [
    { label: "Data Structures",   color: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-500/10" },
    { label: "Linear Algebra",    color: "text-teal-600 dark:text-teal-300",       bg: "bg-teal-500/10"    },
  ];
  return (
    <div className="mb-3 flex h-14 items-center">
      <div className="relative w-full">
        {notes.map((n, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.28 }}
            className={`absolute left-0 right-0 ${n.bg} rounded-lg px-2.5 py-1.5 border border-border/50`}
            style={{ top: `${i * 8}px`, zIndex: 2 - i } as React.CSSProperties}
          >
            <p className={`text-[10px] font-semibold ${n.color} truncate`}>{n.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Card definitions ──────────────────────────────────────────────────────

const CARD_META = [
  {
    to: "/flatmates",
    Icon: HeartHandshake,
    title: "Find Flatmates",
    subtitle: "Match with roommates",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-500 dark:text-sky-400",
    statBg: "bg-sky-500/10",
    statColor: "text-sky-600 dark:text-sky-400",
    stat: "Match now",
  },
  {
    to: "/assistant",
    Icon: Bot,
    title: "AI Assistant",
    subtitle: "Ask anything",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-500 dark:text-violet-400",
    statBg: "bg-violet-500/10",
    statColor: "text-violet-600 dark:text-violet-400",
    stat: "Online",
  },
  {
    to: "/properties",
    Icon: Building2,
    title: "Properties",
    subtitle: "Browse rentals",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-500 dark:text-blue-400",
    statBg: "bg-blue-500/10",
    statColor: "text-blue-600 dark:text-blue-400",
    stat: "View all",
  },
  {
    to: "/study",
    Icon: BookOpen,
    title: "Study Hub",
    subtitle: "Notes & groups",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    statBg: "bg-emerald-500/10",
    statColor: "text-emerald-700 dark:text-emerald-400",
    stat: "Explore",
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────

export function HomePage() {
  const { snapshot } = useData();

  if (snapshot.profile.user_type === "landlord") return <LandlordHome />;

  const firstName = snapshot.profile.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12 ? "Good morning" :
    hour >= 12 && hour < 18 ? "Good afternoon" :
    "Good evening";
  const userCity = snapshot.profile.city;
  const unread = snapshot.notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Theme-adaptive background: --bg-base color + ambient brand blobs + grain.
          The body CSS handles this globally, but we reinforce with a dedicated
          layer so the home page blobs are stronger than on content pages. */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute -left-[20%] -top-[10%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-primary)" }} />
        <div className="absolute -right-[15%] top-[18%] h-[44vh] w-[44vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-secondary)" }} />
        <div className="absolute bottom-[8%] left-[5%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-accent)" }} />
        <div className="bg-noise absolute inset-0"
          style={{ opacity: "var(--grain-opacity)" }} />
      </div>

      <div className="space-y-6 px-5 pb-32" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs font-medium text-muted-foreground">{greeting}</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{firstName}</h1>
            {userCity && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <MapPin size={10} />
                <span>{userCity}, Cyprus</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <Link
              to="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full glass transition hover:opacity-80"
            >
              <Bell size={17} className="text-foreground/80" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </Link>
          </motion.div>
        </div>

        {/* ── Subtitle ── */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-[15px] font-medium text-muted-foreground"
        >
          What do you want to do today?
        </motion.p>

        {/* ── 2×2 Quick-action grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {CARD_META.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + i * 0.07, duration: 0.35 }}
              whileTap={{ scale: 0.96 }}
            >
              <Link
                to={card.to}
                className="glass-card flex flex-col rounded-3xl p-4 transition-opacity active:opacity-75 block"
              >
                {/* Mini live preview */}
                {i === 0 && <FlatmatesPreview />}
                {i === 1 && <AIPreview />}
                {i === 2 && <PropertyPreview properties={snapshot.featuredProperties} />}
                {i === 3 && <StudyPreview />}

                {/* Icon */}
                <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.Icon size={18} className={card.iconColor} />
                </span>

                {/* Text */}
                <p className="text-[13px] font-bold leading-snug text-foreground">{card.title}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{card.subtitle}</p>

                {/* Stat pill */}
                <span className={`mt-2.5 inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${card.statBg} ${card.statColor}`}>
                  {card.stat}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Upcoming Events ── */}
        <UpcomingEvents />
      </div>
    </div>
  );
}
