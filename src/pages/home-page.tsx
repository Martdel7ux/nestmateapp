import { Link, useNavigate } from "react-router-dom";
import { Bell, MapPin, UsersRound, Sparkles, KeyRound, GraduationCap, AlertCircle, Clock, Wallet, FolderOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { LandlordHome } from "@/components/features/landlord/landlord-home";
import { UpcomingEvents } from "@/components/features/home/UpcomingEvents";
import { useUpcomingRentPayment } from "@/hooks/use-rent";
import { ExpiringSoonStrip } from "@/components/features/documents/ExpiringSoonStrip";
import { LocalToolsSection } from "@/components/features/tools/LocalToolsSection";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── Action tile ───────────────────────────────────────────────────────────

interface ActionTileProps {
  to: string;
  icon: LucideIcon;
  label: string;
  color: string;
  ariaLabel: string;
}

function ActionTile({ to, icon: Icon, label, color, ariaLabel }: ActionTileProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.1 }}
      className="flex-shrink-0"
    >
      <Link
        to={to}
        aria-label={ariaLabel}
        className="flex flex-col justify-between rounded-[20px] p-3.5 focus-visible:outline-2 focus-visible:outline-primary hover:brightness-105 transition-[filter] duration-150"
        style={{ width: "108px", height: "108px", background: color }}
      >
        {/* Icon badge */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.25)" }}
        >
          <Icon size={18} strokeWidth={1.8} className="text-white" />
        </div>
        {/* Label */}
        <p className="text-[12px] font-semibold leading-tight text-white/95 line-clamp-2">{label}</p>
      </Link>
    </motion.div>
  );
}

// ── Action tile definitions ───────────────────────────────────────────────

const ACTIONS: ActionTileProps[] = [
  {
    to:        "/flatmates",
    icon:      UsersRound,
    label:     "Flatmates",
    color:     "var(--action-flatmates)",
    ariaLabel: "Open Flatmates",
  },
  {
    to:        "/assistant",
    icon:      Sparkles,
    label:     "Ask NestmateAI",
    color:     "var(--action-ai)",
    ariaLabel: "Open AI Assistant",
  },
  {
    to:        "/properties",
    icon:      KeyRound,
    label:     "Properties",
    color:     "var(--action-property)",
    ariaLabel: "Open Properties",
  },
  {
    to:        "/study",
    icon:      GraduationCap,
    label:     "Study Hub",
    color:     "var(--action-study)",
    ariaLabel: "Open Study Hub",
  },
  {
    to:        "/rent",
    icon:      Wallet,
    label:     "Rent",
    color:     "var(--action-flatmates)",
    ariaLabel: "Open Rent",
  },
  {
    to:        "/documents",
    icon:      FolderOpen,
    label:     "Documents",
    color:     "var(--action-study)",
    ariaLabel: "Open Documents",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────

function RentChip({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data: payment } = useUpcomingRentPayment(userId);
  if (!payment) return null;

  const due   = new Date(payment.due_date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days  = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (days > 7 && payment.status !== "late") return null;

  const overdue = days < 0 || payment.status === "late";
  const label   = overdue
    ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
    : days === 0 ? "Due today"
    : days === 1 ? "Due tomorrow"
    : `Due in ${days} days`;
  const amount  = `€${Number(payment.amount).toFixed(2)}`;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/rent/payments/${payment.id}`)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={cn(
        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left active:scale-[0.98] transition-transform",
        overdue ? "bg-rose-50 dark:bg-rose-900/20" : "bg-amber-50 dark:bg-amber-900/20"
      )}
    >
      {overdue
        ? <AlertCircle size={16} className="text-rose-500 shrink-0" />
        : <Clock size={16} className="text-amber-500 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm font-semibold", overdue ? "text-rose-600 dark:text-rose-400" : "text-amber-700 dark:text-amber-400")}>
          Rent {label}
        </span>
        <span className="text-sm text-muted-foreground"> · {amount}</span>
      </div>
      <span className="text-xs font-semibold text-primary shrink-0">Mark paid →</span>
    </motion.button>
  );
}

export function HomePage() {
  const { snapshot } = useData();
  const { user } = useAuth();

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
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div
          className="absolute -left-[20%] -top-[10%] h-[48vh] w-[48vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-primary)" }}
        />
        <div
          className="absolute -right-[15%] top-[18%] h-[44vh] w-[44vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-secondary)" }}
        />
        <div
          className="absolute bottom-[8%] left-[5%] h-[40vh] w-[40vh] rounded-full blur-[90px]"
          style={{ background: "var(--ambient-accent)" }}
        />
        <div
          className="bg-noise absolute inset-0"
          style={{ opacity: "var(--grain-opacity)" }}
        />
      </div>

      <div className="space-y-7 px-5 pb-32" style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}>

        {/* ── Header row: greeting + bell ── */}
        <div className="flex items-start justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{greeting}</p>
            <h1 className="text-[32px] font-light leading-[1.15] tracking-tight text-foreground">
              Welcome, {firstName}
            </h1>
            <p className="mt-1 text-[18px] font-light leading-snug text-muted-foreground">
              What do you want to do?
            </p>
            {userCity && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <MapPin size={10} />
                <span>{userCity}, Cyprus</span>
              </div>
            )}
          </motion.div>

          {/* Notification bell */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex-shrink-0 mt-1"
          >
            <Link
              to="/notifications"
              aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
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

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <p className="mb-3 text-[14px] font-semibold text-foreground">Actions</p>
          {/* Horizontal scroll row — extend past page gutter for peek effect */}
          <div className="-mx-5">
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
              {ACTIONS.map((action, i) => (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.3 }}
                  className="snap-start"
                >
                  <ActionTile {...action} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Rent chip ── */}
        {user && <RentChip userId={user.id} />}

        {/* ── Document expiry strip ── */}
        <ExpiringSoonStrip />

        {/* ── Local Tools strip ── */}
        <LocalToolsSection />

        {/* ── Upcoming Events ── */}
        <UpcomingEvents />

      </div>
    </div>
  );
}
