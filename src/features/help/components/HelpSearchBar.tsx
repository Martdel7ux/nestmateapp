import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

interface Props {
  autoFocus?: boolean;
  initialValue?: string;
}

export function HelpSearchBar({ autoFocus, initialValue = "" }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = ref.current?.value.trim() ?? "";
    if (q) navigate(`/profile/help/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
      />
      <input
        ref={ref}
        type="search"
        defaultValue={initialValue}
        autoFocus={autoFocus}
        placeholder="Search help articles…"
        className={[
          "w-full rounded-full py-3 pl-10 pr-4 text-sm",
          "[background:var(--glass-fill)] border border-[var(--glass-border)]",
          "[backdrop-filter:blur(20px)_saturate(180%)]",
          "text-foreground placeholder:text-muted-foreground/60",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          "transition",
        ].join(" ")}
      />
    </form>
  );
}
