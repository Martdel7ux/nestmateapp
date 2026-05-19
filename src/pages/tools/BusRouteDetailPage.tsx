import { lazy, Suspense, useState } from "react";
import { useParams } from "react-router-dom";
import { Bus, ArrowLeftRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { StopArrivalsSheet } from "@/components/features/tools/buses/StopArrivalsSheet";
import {
  useGtfsRoute, useRouteDirections, useRouteStops, useRouteShape,
} from "@/hooks/use-gtfs";
import type { GtfsStopWithSeq } from "@/types/gtfs";
import { routeBgColor, routeTextColor } from "@/types/gtfs";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

const BusRouteMap = lazy(() =>
  import("@/components/features/tools/buses/BusRouteMap").then((m) => ({ default: m.BusRouteMap }))
);

export function BusRouteDetailPage() {
  const { routeId } = useParams<{ routeId: string }>();

  const [direction,  setDirection]  = useState(0);
  const [sheetStop,  setSheetStop]  = useState<{ id: string; name: string } | null>(null);

  const { data: route,      isLoading: routeLoading } = useGtfsRoute(routeId);
  const { data: directions = [] }                      = useRouteDirections(routeId);
  const { data: stops = [],   isLoading: stopsLoading } = useRouteStops(routeId, direction);
  const { data: shape = [] }                           = useRouteShape(routeId, direction);

  const bg   = routeBgColor(route?.route_color);
  const text = routeTextColor(route?.route_text_color);

  const title = route
    ? `Route ${route.route_short_name ?? ''}`
    : 'Bus Route';

  function handleStopTap(stop: GtfsStopWithSeq) {
    setSheetStop({ id: stop.stop_id, name: stop.stop_name });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={title} />

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Route header */}
        {route && (
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-base"
              style={{ backgroundColor: bg, color: text }}
            >
              {route.route_short_name ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground leading-tight">
                {route.route_long_name ?? route.route_short_name}
              </p>
              {route.route_desc && (
                <p className="text-xs text-muted-foreground mt-0.5">{route.route_desc}</p>
              )}
            </div>
          </div>
        )}

        {routeLoading && (
          <div className="px-4 pt-4">
            <div className="h-16 rounded-2xl bg-muted/30 animate-pulse" />
          </div>
        )}

        {/* Direction tabs */}
        {directions.length > 1 && (
          <div className="flex gap-2 px-4 pb-3">
            {directions.map((dir) => (
              <button
                key={dir.direction_id}
                type="button"
                onClick={() => setDirection(dir.direction_id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition-all",
                  direction === dir.direction_id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                <ArrowLeftRight size={12} />
                {dir.trip_headsign ?? `Direction ${dir.direction_id}`}
              </button>
            ))}
          </div>
        )}

        {/* Map */}
        <div className="px-4 pb-4">
          {shape.length > 0 || stops.length > 0 ? (
            <Suspense fallback={
              <div
                className="rounded-2xl border border-border bg-muted/20 flex items-center justify-center"
                style={{ height: 260 }}
              >
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            }>
              <BusRouteMap
                shape={shape}
                stops={stops}
                routeColor={route?.route_color ?? '3b82f6'}
                selectedStopId={sheetStop?.id ?? null}
                onStopClick={handleStopTap}
              />
            </Suspense>
          ) : !stopsLoading && (
            <div
              className="rounded-2xl border border-border bg-muted/10 flex items-center justify-center"
              style={{ height: 260 }}
            >
              <p className="text-xs text-muted-foreground">Map data loading…</p>
            </div>
          )}
        </div>

        {/* Stop list */}
        <div className="px-4 space-y-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {stops.length > 0 ? `${stops.length} Stops` : 'Stops'}
          </p>

          {stopsLoading && (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="w-2 h-2 rounded-full bg-muted/40 shrink-0" />
                <div className="flex-1 h-4 rounded bg-muted/30 animate-pulse" />
              </div>
            ))
          )}

          {!stopsLoading && stops.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Bus size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No stop data available</p>
            </div>
          )}

          {stops.map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === stops.length - 1;
            const isSelected = sheetStop?.id === stop.stop_id;

            return (
              <button
                key={stop.stop_id}
                type="button"
                onClick={() => handleStopTap(stop)}
                className="w-full flex items-center gap-3 py-2.5 text-left active:bg-muted/20 rounded-xl px-1 transition-colors"
              >
                {/* Timeline dot */}
                <div className="relative flex flex-col items-center shrink-0 self-stretch" style={{ width: 20 }}>
                  {!isFirst && (
                    <div
                      className="absolute top-0 bottom-1/2 w-px left-1/2 -translate-x-1/2"
                      style={{ backgroundColor: bg, opacity: 0.4 }}
                    />
                  )}
                  <div
                    className="relative z-10 h-3 w-3 rounded-full border-2 mt-auto mb-auto"
                    style={{
                      borderColor:     bg,
                      backgroundColor: isFirst || isLast ? bg : '#ffffff',
                    }}
                  />
                  {!isLast && (
                    <div
                      className="absolute top-1/2 bottom-0 w-px left-1/2 -translate-x-1/2"
                      style={{ backgroundColor: bg, opacity: 0.4 }}
                    />
                  )}
                </div>

                {/* Stop name */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm truncate",
                    isSelected ? "font-bold text-foreground" : "text-foreground/80",
                    (isFirst || isLast) && "font-semibold"
                  )}>
                    {stop.stop_name}
                  </p>
                  <MapPin
                    size={13}
                    className={cn(
                      "shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground/40"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {stops.length > 0 && (
          <p className="text-xs text-muted-foreground text-center px-4 pt-4 pb-2">
            Tap any stop to see next arrivals
          </p>
        )}
      </div>

      {/* Stop arrivals bottom sheet */}
      {sheetStop && (
        <StopArrivalsSheet
          stopId={sheetStop.id}
          stopName={sheetStop.name}
          onClose={() => setSheetStop(null)}
        />
      )}
    </div>
  );
}
