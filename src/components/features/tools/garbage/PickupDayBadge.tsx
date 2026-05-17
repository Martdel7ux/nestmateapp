import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  days: number[];
  color?: "green" | "blue" | "amber";
}

function daysUntilNext(days: number[]): number | null {
  if (days.length === 0) return null;
  const today = new Date().getDay(); // 0=Sun
  let min = 7;
  for (const d of days) {
    const diff = (d - today + 7) % 7;
    if (diff < min) min = diff;
  }
  return min;
}

export function PickupDayBadge({ days, color = "green" }: Props) {
  const colorMap = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  if (days.length === 0) return <span className="text-xs text-muted-foreground">Not scheduled</span>;

  const next = daysUntilNext(days);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {days.map((d) => (
        <span key={d} className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", colorMap[color])}>
          {DAY_NAMES[d]}
        </span>
      ))}
      {next === 0 && (
        <span className="rounded-full bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
          Today!
        </span>
      )}
      {next === 1 && (
        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
          Tomorrow!
        </span>
      )}
    </div>
  );
}
