import { type ReactNode, useState } from "react";
import { ArrowLeft, Bell, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useData } from "@/contexts/data-context";
import { useScrolled } from "@/hooks/use-scrolled";
import { SearchBarTrigger } from "@/features/search/components/SearchBarTrigger";

type RightSlot =
  | { type: "notifications" }
  | { type: "search"; onSearch: (q: string) => void; placeholder?: string }
  | { type: "none" }
  | { type: "custom"; element: ReactNode };

interface AppHeaderProps {
  variant?: "home" | "top-level" | "sub-page";
  title: string;
  subtitle?: string;
  right?: RightSlot;
  onBack?: () => void;
  children?: ReactNode;
  /** Set false to hide universal search bar (e.g. Messages page has its own search) */
  universalSearch?: boolean;
}

function NotifBell({ unread }: { unread: number }) {
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm transition hover:brightness-110"
    >
      <Bell size={18} className="text-foreground" />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
          {unread}
        </span>
      )}
    </Link>
  );
}

const searchMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
};

export function AppHeader({
  variant = "top-level",
  title,
  subtitle,
  right,
  onBack,
  children,
  universalSearch = true,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { snapshot } = useData();
  const unread = snapshot.notifications.filter((n) => !n.is_read).length;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const isScrolled   = useScrolled();     // threshold 8px  → glass bg
  const isCollapsed  = useScrolled(50);   // threshold 50px → size/layout animation

  const handleBack = onBack ?? (() => navigate(-1));
  // Home variant is always transparent — never enter the scrolled state
  const scrolledAttr = variant !== "home" && isScrolled ? "" : undefined;

  function getRightSlotElement(): ReactNode {
    if (!right || right.type === "none") return null;
    if (right.type === "notifications") return <NotifBell unread={unread} />;
    if (right.type === "custom") return right.element;
    if (right.type === "search" && !searching) {
      return (
        <button
          type="button"
          onClick={() => setSearching(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm transition hover:brightness-110"
          aria-label="Search conversations"
        >
          <Search size={18} className="text-foreground" />
        </button>
      );
    }
    return null;
  }

  // ── Sub-page variant ───────────────────────────────────────────────────────
  if (variant === "sub-page") {
    // Inline search replaces entire header
    if (right?.type === "search" && searching) {
      return (
        <header
          className="app-header app-header--sub-page shrink-0 sticky top-0 z-40 flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          data-scrolled={scrolledAttr}
        >
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-background/70 dark:bg-slate-800/70 px-3 py-2">
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                right.onSearch(e.target.value);
              }}
              placeholder={right.placeholder ?? "Search…"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => { setSearching(false); setQuery(""); right.onSearch(""); }}
              aria-label="Close search"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        </header>
      );
    }

    const slotEl = getRightSlotElement();
    const showSearch = universalSearch && right?.type !== "search";

    return (
      <header
        className={`app-header app-header--sub-page shrink-0 sticky top-0 z-40 px-4
          transition-[padding] duration-300 ease-in-out
          ${isCollapsed
            ? "pb-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]"
            : "pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"}`}
        data-scrolled={scrolledAttr}
      >
        {/* Title row — back button stays left, title slides to center */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="absolute left-0 z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md transition hover:brightness-110 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={`w-full transition-[padding,font-size,color,opacity] duration-300 ease-in-out
            ${isCollapsed ? "pl-0" : "pl-11"}`}>
            <p className={`truncate font-semibold text-foreground leading-snug
              transition-[padding,font-size,color,opacity] duration-300 ease-in-out
              ${isCollapsed ? "text-[15px] text-center" : "text-[18px] text-left"}`}>
              {title}
            </p>
            {subtitle && !isCollapsed && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {slotEl && (
            <div className="absolute right-0 z-10 flex shrink-0 items-center">
              {slotEl}
            </div>
          )}
        </div>

        {/* Universal search bar — animates out on scroll */}
        {showSearch && (
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div key="sub-search" className="mt-2 overflow-hidden" {...searchMotion}>
                <SearchBarTrigger />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {children}
      </header>
    );
  }

  // ── Top-level / home variant ───────────────────────────────────────────────

  // Inline search replaces entire header row
  if (right?.type === "search" && searching) {
    return (
      <div
        className="app-header app-header--top-level shrink-0 sticky top-0 z-40 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]"
        data-scrolled={scrolledAttr}
      >
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-background/70 dark:bg-slate-800/70 px-3 py-2">
          <Search size={15} className="shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); right.onSearch(e.target.value); }}
            placeholder={right.placeholder ?? "Search…"}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => { setSearching(false); setQuery(""); right.onSearch(""); }}
            aria-label="Close search"
          >
            <X size={15} className="text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    );
  }

  const slotEl = getRightSlotElement();
  const showSearch = universalSearch && right?.type !== "search";
  const hasTitle = Boolean(title);

  return (
    <div
      className={`app-header app-header--${variant} shrink-0 sticky top-0 z-40 px-5
        transition-[padding] duration-300 ease-in-out
        ${isCollapsed
          ? "pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
          : "pb-4 pt-[max(1rem,env(safe-area-inset-top))]"}`}
      data-scrolled={scrolledAttr}
    >
      {showSearch ? (
        /* ── Has search bar (most top-level pages + home) ────────────────────── */
        <div className={`relative flex items-center gap-2 transition-[padding,font-size,color,opacity] duration-300 ease-in-out
          ${isCollapsed ? "justify-center" : ""}`}>
          {hasTitle && (
            <h1 className="truncate text-[15px] font-bold text-foreground leading-snug pr-1">
              {title}
            </h1>
          )}

          {/* Search bar: full when at top, compact pill centered when collapsed */}
          <AnimatePresence mode="wait" initial={false}>
            {isCollapsed ? (
              <motion.div
                key="compact-search"
                className="shrink-0"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <SearchBarTrigger compact />
              </motion.div>
            ) : (
              <motion.div key="full-search" className="flex-1 min-w-0" {...searchMotion}>
                <SearchBarTrigger />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bell always pinned absolute right */}
          {slotEl && (
            <div className={`flex shrink-0 items-center ${isCollapsed ? "absolute right-0" : ""}`}>
              {slotEl}
            </div>
          )}
        </div>
      ) : (
        /* ── No search bar — large title collapses (Essentials, etc.) ─────────── */
        <div className="relative">
          <h1 className={`text-foreground transition-[padding,font-size,color,opacity] duration-300 ease-in-out
            ${isCollapsed
              ? "text-[17px] font-semibold text-center block"
              : "font-display text-3xl font-bold truncate text-left"}`}>
            {title}
          </h1>
          {subtitle && !isCollapsed && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {slotEl && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex shrink-0 items-center">
              {slotEl}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
