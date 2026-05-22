import { Search } from "lucide-react";
import { useSearch } from "@/contexts/search-context";

const GLASS = [
  "[background:var(--glass-fill)] border border-[var(--glass-border)]",
  "[backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)]",
  "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.05)]",
  "cursor-pointer transition-[transform,background,border-color] duration-100",
  "hover:[background:var(--glass-fill-hover)] hover:border-[var(--glass-border-strong)]",
  "active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
].join(" ");

interface SearchBarTriggerProps {
  compact?: boolean;
}

export function SearchBarTrigger({ compact = false }: SearchBarTriggerProps) {
  const { open } = useSearch();

  if (compact) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Search Nestmate"
        className={`flex items-center gap-2 rounded-full px-3 py-2 ${GLASS}`}
      >
        <Search size={14} className="shrink-0 text-muted-foreground/70" />
        <span className="text-sm text-muted-foreground/70 leading-none">Search</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search Nestmate"
      className={`flex w-full items-center gap-2.5 rounded-full px-3.5 py-2 ${GLASS}`}
    >
      <Search size={15} className="shrink-0 text-muted-foreground/70" />

      <span className="flex-1 text-left text-sm text-muted-foreground/70 leading-none">
        <span className="hidden sm:inline">Search Nestmate</span>
        <span className="sm:hidden">Search</span>
      </span>

      <span className="hidden lg:flex items-center gap-0.5 shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 leading-none">
        ⌘K
      </span>
    </button>
  );
}
