import { Zap, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EacOutage } from "@/types/tools";

function formatRange(starts: string, ends: string): string {
  const s = new Date(starts);
  const e = new Date(ends);
  const date = s.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const from = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const to   = e.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${from}–${to}`;
}

interface Props {
  outage: EacOutage;
  onClick?: () => void;
}

export function OutageCard({ outage, onClick }: Props) {
  const now     = new Date();
  const starts  = new Date(outage.starts_at);
  const ends    = new Date(outage.ends_at);
  const ongoing = starts <= now && now <= ends;
  const soon    = starts > now && starts.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 rounded-2xl border p-3.5 text-left active:scale-[0.98] transition-transform",
        ongoing ? "border-rose-300 bg-rose-50 dark:bg-rose-900/20"
        : soon  ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20"
                : "border-border bg-background/60"
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
        ongoing ? "bg-rose-100 dark:bg-rose-900/40"
        : soon  ? "bg-amber-100 dark:bg-amber-900/40"
                : "bg-muted"
      )}>
        <Zap size={16} className={cn(
          ongoing ? "text-rose-500" : soon ? "text-amber-500" : "text-muted-foreground"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {ongoing && <span className="text-xs font-bold text-rose-600 uppercase">Ongoing</span>}
          {soon && !ongoing && <span className="text-xs font-bold text-amber-600 uppercase">Soon</span>}
          <span className="text-sm font-semibold text-foreground capitalize">
            {outage.area ?? outage.district ?? "Unknown area"}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Clock size={11} />
          <span>{formatRange(outage.starts_at, outage.ends_at)}</span>
        </div>

        {outage.streets.length > 0 && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin size={11} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{outage.streets.slice(0, 4).join(", ")}{outage.streets.length > 4 ? "…" : ""}</span>
          </div>
        )}
      </div>
    </button>
  );
}
