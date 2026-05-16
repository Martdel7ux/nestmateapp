import { type ReactNode, useState } from "react";
import { ArrowLeft, Bell, Search, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "@/contexts/data-context";

type RightSlot =
  | { type: "notifications" }
  | { type: "search"; onSearch: (q: string) => void; placeholder?: string }
  | { type: "none" }
  | { type: "custom"; element: ReactNode };

interface AppHeaderProps {
  variant?: "top-level" | "sub-page";
  title: string;
  subtitle?: string;
  right?: RightSlot;
  onBack?: () => void;
  children?: ReactNode;
}

function NotifBell({ unread }: { unread: number }) {
  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-background/60 dark:bg-slate-800/60 shadow-sm transition hover:bg-muted"
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

export function AppHeader({
  variant = "top-level",
  title,
  subtitle,
  right,
  onBack,
  children,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { snapshot } = useData();
  const unread = snapshot.notifications.filter((n) => !n.is_read).length;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const handleBack = onBack ?? (() => navigate(-1));

  function getRightElement(): ReactNode {
    if (!right || right.type === "none") return null;
    if (right.type === "notifications") return <NotifBell unread={unread} />;
    if (right.type === "custom") return right.element;
    if (right.type === "search" && !searching) {
      return (
        <button
          type="button"
          onClick={() => setSearching(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 dark:bg-slate-800/60 shadow-sm transition hover:bg-muted"
          aria-label="Search"
        >
          <Search size={18} className="text-foreground" />
        </button>
      );
    }
    return null;
  }

  if (variant === "sub-page") {
    const rightEl = getRightElement();
    return (
      <header className="shrink-0 flex items-center gap-3 border-b border-border bg-background px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition hover:bg-muted/80 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-foreground leading-snug">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {rightEl && <div className="shrink-0">{rightEl}</div>}
      </header>
    );
  }

  // top-level variant
  const isSearchActive = right?.type === "search" && searching;
  const rightEl = getRightElement();

  return (
    <div className="shrink-0 bg-primary/10 dark:bg-primary/5 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className={`flex items-center justify-between${children ? " mb-3" : ""}`}>
        {isSearchActive && right?.type === "search" ? (
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
              onClick={() => {
                setSearching(false);
                setQuery("");
                right.onSearch("");
              }}
              aria-label="Close search"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {rightEl && (
              <div className="flex shrink-0 items-center gap-2">
                {rightEl}
              </div>
            )}
          </>
        )}
      </div>
      {children}
    </div>
  );
}
