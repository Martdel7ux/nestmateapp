import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { Star, Clock, RefreshCw, Bus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import {
  useGtfsStop, useNextArrivals, useRoutesAtStop,
  useBusFavorites, useToggleBusFavorite,
} from "@/hooks/use-gtfs";
import { routeBgColor, routeTextColor, formatMinutesUntil } from "@/types/gtfs";
import { cn } from "@/lib/utils";

export function BusStopPage() {
  const { t } = useI18n();
  const { stopId }   = useParams<{ stopId: string }>();
  const navigate     = useNavigate();

  const { data: stop,       isLoading: stopLoading }    = useGtfsStop(stopId);
  const { data: arrivals = [], isLoading: arrivLoading,
          dataUpdatedAt, refetch }                       = useNextArrivals(stopId);
  const { data: routes = [] }                            = useRoutesAtStop(stopId);
  const { data: favorites = [] }                         = useBusFavorites();
  const { mutate: toggle, isPending }                    = useToggleBusFavorite();

  const isFav = favorites.some((f) => f.stop_id === stopId);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  if (!stopLoading && !stop) {
    return (
      <div className="flex h-full flex-col">
        <AppHeader variant="sub-page" title="Bus Stop" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <Bus size={40} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("busStopNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Bus Stop" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {/* Stop header */}
        {stopLoading ? (
          <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
        ) : stop && (
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bus Stop</p>
                <p className="text-lg font-bold text-foreground leading-tight mt-0.5">{stop.stop_name}</p>
                {stop.stop_code && (
                  <p className="text-xs text-muted-foreground mt-1">Stop #{stop.stop_code}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggle({ stopId: stop.stop_id, isFav })}
                disabled={isPending}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-xl border transition-all",
                  isFav
                    ? "border-amber-400 bg-amber-400/10 text-amber-500"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        )}

        {/* Routes serving this stop */}
        {routes.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {t("busStopRoutes")}
            </p>
            <div className="flex flex-wrap gap-2">
              {routes.map((r) => (
                <button
                  key={r.route_id}
                  type="button"
                  onClick={() => navigate(`/tools/buses/route/${r.route_id}`)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                  style={{
                    backgroundColor: `${routeBgColor(r.route_color)}20`,
                    border:          `1px solid ${routeBgColor(r.route_color)}50`,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: routeBgColor(r.route_color) }}>
                    {r.route_short_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next arrivals */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("busStopNextArrivals")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1 text-xs text-primary font-semibold"
            >
              <RefreshCw size={11} />
              {lastUpdated ? `Updated ${lastUpdated}` : t("busStopRefresh")}
            </button>
          </div>

          {arrivLoading && (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!arrivLoading && arrivals.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed border-border">
              <Clock size={32} className="text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">{t("busesNoMoreToday")}</p>
              <p className="text-xs text-muted-foreground/70">{t("busStopCheckTomorrow")}</p>
            </div>
          )}

          <div className="space-y-2">
            {arrivals.map((arrival, idx) => {
              const bg   = routeBgColor(arrival.route_color);
              const text = routeTextColor(arrival.route_text_color);
              const mins = arrival.minutes_until;

              return (
                <button
                  key={`${arrival.route_id}-${idx}`}
                  type="button"
                  onClick={() => navigate(`/tools/buses/route/${arrival.route_id}`)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3.5 text-left active:bg-muted/30"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {arrival.route_short_name ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {arrival.trip_headsign ?? arrival.route_long_name ?? ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {arrival.arrival_time.slice(0, 5)}
                    </p>
                  </div>

                  <div className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-sm font-bold",
                    mins <= 2
                      ? "bg-red-500/10 text-red-500"
                      : mins <= 8
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-primary/10 text-primary"
                  )}>
                    {formatMinutesUntil(mins)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
