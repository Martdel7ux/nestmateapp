import { ChevronDown, ChevronUp, ExternalLink, MapPin } from "lucide-react";
import { useState } from "react";
import type { BusRoute } from "@/types/tools";
import { cn } from "@/lib/utils";

interface Props {
  route: BusRoute;
}

export function BusRouteCard({ route }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-3 p-3.5 text-left"
      >
        {/* Route code badge */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="text-xs font-bold text-primary leading-none text-center">{route.route_code}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{route.route_name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {route.operator && (
              <span className="text-xs text-muted-foreground">{route.operator}</span>
            )}
            {route.typical_frequency && (
              <span className="text-xs text-muted-foreground">{route.typical_frequency}</span>
            )}
            {route.fare_eur !== null && route.fare_eur !== undefined && (
              <span className={cn(
                "text-xs font-semibold",
                route.fare_eur === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              )}>
                {route.fare_eur === 0 ? "Free" : `€${route.fare_eur.toFixed(2)}`}
              </span>
            )}
          </div>
          {route.first_departure && route.last_departure && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {route.first_departure} – {route.last_departure}
            </p>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="shrink-0 text-muted-foreground mt-1" />
                  : <ChevronDown size={16} className="shrink-0 text-muted-foreground mt-1" />}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {route.notes && (
            <p className="text-xs text-muted-foreground">{route.notes}</p>
          )}

          {route.stops && route.stops.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stops</p>
              <div className="space-y-1.5">
                {route.stops
                  .sort((a, b) => a.stop_order - b.stop_order)
                  .map((stop, idx, arr) => (
                    <div key={stop.id} className="flex items-center gap-2">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          idx === 0 || idx === arr.length - 1 ? "bg-primary" : "bg-muted-foreground/40"
                        )} />
                        {idx < arr.length - 1 && <div className="w-px flex-1 bg-border" style={{ height: 12 }} />}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground">{stop.stop_name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {route.source_url && (
            <a
              href={route.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary font-semibold"
            >
              Official timetable <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
