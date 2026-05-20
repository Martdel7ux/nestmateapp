import { useNavigate } from "react-router-dom";
import { PersonStanding, Bus, ChevronRight } from "lucide-react";
import type { TripOption } from "@/types/gtfs";
import { routeBgColor, routeTextColor } from "@/types/gtfs";
import { cn } from "@/lib/utils";

interface Props {
  trip: TripOption;
}

function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "Asia/Nicosia",
  });
}

function minutesFromNow(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 80)); // 80 m/min ≈ comfortable walk
}

export function TripResultCard({ trip }: Props) {
  const navigate   = useNavigate();
  const bg         = routeBgColor(trip.route_color);
  const text       = routeTextColor(trip.route_text_color);

  const walkTo     = walkMinutes(trip.from_stop_distance_meters);
  const walkFrom   = walkMinutes(trip.to_stop_distance_meters);
  const totalMins  = walkTo + trip.trip_duration_minutes + walkFrom;
  const depInMins  = minutesFromNow(trip.departure_time);

  const urgency =
    depInMins <= 2  ? "text-red-500"
    : depInMins <= 8  ? "text-amber-600 dark:text-amber-400"
    : "text-primary";

  return (
    <button
      type="button"
      onClick={() => navigate(`/tools/buses/route/${trip.route_id}`)}
      className="w-full rounded-2xl border border-border bg-background/60 p-4 text-left active:bg-muted/30 transition-colors"
    >
      {/* Route badge + name */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
          style={{ backgroundColor: bg, color: text }}
        >
          {trip.route_short_name ?? "?"}
        </div>
        <p className="flex-1 text-sm font-semibold text-foreground truncate">
          {trip.route_long_name ?? trip.route_short_name}
        </p>
        <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
      </div>

      {/* Journey timeline */}
      <div className="space-y-2 pl-1">

        {/* Walk to stop */}
        <div className="flex items-center gap-2.5">
          <PersonStanding size={14} className="shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Walk <span className="font-semibold text-foreground">{walkTo} min</span>
            {" "}to <span className="font-semibold text-foreground">{trip.from_stop_name}</span>
          </p>
        </div>

        {/* Bus leg */}
        <div className="flex items-center gap-2.5">
          <Bus size={14} className="shrink-0" style={{ color: bg }} />
          <div className="flex-1 flex items-baseline justify-between gap-2">
            <p className="text-xs text-foreground">
              Departs{" "}
              <span className="font-bold">{formatLocalTime(trip.departure_time)}</span>
              {" · "}
              <span className="font-semibold text-foreground">
                {trip.trip_duration_minutes} min
              </span>
              <span className="text-muted-foreground"> · {trip.stop_count} stops</span>
            </p>
            <span className={cn("text-xs font-bold shrink-0", urgency)}>
              {depInMins <= 0 ? "Now" : `${depInMins} min`}
            </span>
          </div>
        </div>

        {/* Walk from stop */}
        <div className="flex items-center gap-2.5">
          <PersonStanding size={14} className="shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Walk <span className="font-semibold text-foreground">{walkFrom} min</span>
            {" "}from <span className="font-semibold text-foreground">{trip.to_stop_name}</span>
          </p>
        </div>
      </div>

      {/* Footer: total + arrival */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Total <span className="font-bold text-foreground">{totalMins} min</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Arrive ~<span className="font-semibold text-foreground">
            {formatLocalTime(
              new Date(
                new Date(trip.arrival_time).getTime() + walkFrom * 60_000
              ).toISOString()
            )}
          </span>
        </p>
      </div>
    </button>
  );
}
