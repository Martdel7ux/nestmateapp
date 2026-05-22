import { Link, useNavigate } from "react-router-dom";
import {
  UsersRound, BookOpen, Bus, Sparkles, ChevronRight,
  Wallet, FolderOpen, Receipt,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useUpcomingRentPayment } from "@/hooks/use-rent";

// ── Static tools ──────────────────────────────────────────────────────────────

const TOOLS = [
  {
    id: "flatmates",
    label: "Flatmates",
    subtitle: "Find students to share with",
    icon: UsersRound,
    path: "/flatmates",
    style: { background: "linear-gradient(135deg, #97C459 0%, #639922 100%)" },
  },
  {
    id: "study",
    label: "Study Hub",
    subtitle: "Share notes & find study peers",
    icon: BookOpen,
    path: "/study",
    style: { background: "linear-gradient(135deg, #5DCAA5 0%, #1D9E75 100%)" },
  },
  {
    id: "buses",
    label: "Buses",
    subtitle: "Trip planner & live arrivals",
    icon: Bus,
    path: "/tools/buses",
    style: { background: "linear-gradient(135deg, #85B7EB 0%, #378ADD 100%)" },
  },
  {
    id: "ai",
    label: "Nestmate AI",
    subtitle: "Your personal assistant",
    icon: Sparkles,
    path: "/assistant",
    style: { background: "linear-gradient(135deg, #AFA9EC 0%, #7F77DD 100%)" },
  },
] as const;

const ROW_CLASS =
  "flex items-center gap-4 rounded-[18px] px-4 py-3.5 " +
  "bg-[var(--glass-fill)] border border-[var(--glass-border)] " +
  "hover:brightness-105 active:brightness-95 transition-[filter] duration-150";

// ── Rent row (dynamic) ────────────────────────────────────────────────────────

function RentRow({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data: payment } = useUpcomingRentPayment(userId);

  const subtitle = (() => {
    if (!payment) return "No upcoming payments";
    const due   = new Date(payment.due_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days  = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    const amount = `€${Number(payment.amount).toFixed(0)}`;
    if (payment.status === "late" || days < 0) return `${amount} · Overdue`;
    if (days === 0) return `${amount} · Due today`;
    if (days === 1) return `${amount} · Due tomorrow`;
    return `${amount} · Due in ${days} days`;
  })();

  const badge = (() => {
    if (!payment) return undefined;
    const due   = new Date(payment.due_date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days  = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (payment.status === "late" || days < 0) return { text: "Overdue", variant: "danger" as const };
    if (days <= 7) return { text: "Due soon", variant: "warning" as const };
    return undefined;
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => payment ? navigate(`/rent/payments/${payment.id}`) : navigate("/rent")}
      onKeyDown={(e) => e.key === "Enter" && (payment ? navigate(`/rent/payments/${payment.id}`) : navigate("/rent"))}
      className={`${ROW_CLASS} cursor-pointer`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: "linear-gradient(135deg, #F5A25A 0%, #E07020 100%)" }}>
        <Wallet size={22} strokeWidth={1.8} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Rent</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      </div>
      {badge && (
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
          badge.variant === "danger"
            ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          {badge.text}
        </span>
      )}
      <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ToolsPage() {
  const { user } = useAuth();
  const reduced  = useReducedMotion();

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
      <AppHeader variant="home" title="Essentials" universalSearch={false} />

      {/* Blur veil below header */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[39]"
        style={{
          height: "calc(72px + env(safe-area-inset-top))",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          maskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent 100%)",
        }} />

      <div className="px-5 pb-32 pt-4 space-y-6">

        {/* ── Personal section ── */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="mb-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Personal</p>
          <div className="space-y-3">
            {user && (
              <motion.div
                initial={reduced ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
              >
                <RentRow userId={user.id} />
              </motion.div>
            )}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              <Link to="/documents">
                <div className={ROW_CLASS}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #5BC4D8 0%, #1A8FA8 100%)" }}>
                    <FolderOpen size={22} strokeWidth={1.8} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Documents</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Passport, insurance, contracts</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            </motion.div>
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
            >
              <Link to="/household">
                <div className={ROW_CLASS}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, #EC7FAA 0%, #D0366E 100%)" }}>
                    <Receipt size={22} strokeWidth={1.8} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Bill Splitting</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Expenses, balances, settle up</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Student tools section ── */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <p className="mb-3 text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Student tools</p>
          <div className="space-y-3">
            {TOOLS.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={reduced ? undefined : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
                >
                  <Link to={tool.path}>
                    <div className={ROW_CLASS}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={tool.style}>
                        <Icon size={22} strokeWidth={2} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{tool.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{tool.subtitle}</p>
                      </div>
                      <ChevronRight size={14} className="shrink-0 text-muted-foreground/50" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
