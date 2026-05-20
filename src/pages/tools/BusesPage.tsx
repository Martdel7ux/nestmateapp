import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Bus, Navigation } from "lucide-react";
import { useGtfsRoutes, useBusFavorites, useNextArrivals, useGtfsStop, useToggleBusFavorite } from "@/hooks/use-gtfs";
import { BusRouteCard } from "@/components/features/tools/buses/BusRouteCard";
import { AppHeader } from "@/components/layout/app-header";
import { StopArrivalsSheet } from "@/components/features/tools/buses/StopArrivalsSheet";
import type { GtfsRoute } from "@/types/gtfs";
import { routeBgColor, routeTextColor } from "@/types/gtfs";
import { cn } from "@/lib/utils";

type Tab = "routes" | "my-stops";

// ── Saved stop row with live arrivals ─────────────────────────────────────────

function FavoriteStopRow({
  stopId,
  onOpen,
}: {
  stopId: string;
  onOpen: (id: string, name: string) => void;
}) {
  const { data: stop }                = useGtfsStop(stopId);
  const { data: arrivals = [] }       = useNextArrivals(stopId);
  const { mutate: toggle, isPending } = useToggleBusFavorite();

  if (!stop) return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 h-20 animate-pulse" />
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(stop.stop_id, stop.stop_name)}
      className="w-full rounded-2xl border border-border bg-background/60 p-4 text-left active:bg-muted/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{stop.stop_name}</p>

          {arrivals.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {arrivals.slice(0, 3).map((a, i) => {
                const bg = routeBgColor(a.route_color);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 rounded-xl px-2.5 py-1"
                    style={{ backgroundColor: `${bg}18`, border: `1px solid ${bg}40` }}
                  >
                    <span className="text-xs font-bold" style={{ color: bg }}>
                      {a.route_short_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.minutes_until <= 0 ? 'Now' : `${a.minutes_until} min`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No more buses today</p>
          )}
        </div>

        {/* Unsave */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggle({ stopId, isFav: true }); }}
          disabled={isPending}
          className="shrink-0 text-amber-500 p-1"
        >
          <Star size={16} fill="currentColor" />
        </button>
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BusesPage() {
  const navigate = useNavigate();

  const [tab,       setTab]       = useState<Tab>("routes");
  const [query,     setQuery]     = useState("");
  const [sheetStop, setSheetStop] = useState<{ id: string; name: string } | null>(null);

  const { data: routes = [], isLoading } = useGtfsRoutes();
  const { data: favorites = [] }         = useBusFavorites();

  const filtered = useMemo<GtfsRoute[]>(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.route_short_name?.toLowerCase().includes(q) ||
        r.route_long_name?.toLowerCase().includes(q)
    );
  }, [routes, query]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Nicosia Buses" />

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 pb-2">
        {([ ["routes", "Routes"], ["my-stops", "My Stops"] ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-semibold transition-all",
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground"
            )}
          >
            {label}
            {id === "my-stops" && favorites.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({favorites.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Routes tab ── */}
      {tab === "routes" && (
        <>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                placeholder="Search route number or name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted/30 animate-pulse" />
              ))
            }

            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Bus size={36} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {query ? "No routes match your search" : "No routes found — check that GTFS data is imported"}
                </p>
              </div>
            )}

            {filtered.map((route) => (
              <BusRouteCard key={route.route_id} route={route} />
            ))}

            {!isLoading && routes.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
                {routes.length} Nicosia routes · OSY GTFS data valid through Aug 2026
              </p>
            )}
          </div>
        </>
      )}

      {/* ── My Stops tab ── */}
      {tab === "my-stops" && (
        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-28 space-y-2">
          {favorites.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <Star size={36} className="text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No saved stops yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Open any route, tap a stop, then tap ★ to save it here for quick access
              </p>
            </div>
          )}

          {favorites.map((fav) => (
            <FavoriteStopRow
              key={fav.stop_id}
              stopId={fav.stop_id}
              onOpen={(id, name) => setSheetStop({ id, name })}
            />
          ))}
        </div>
      )}

      {/* Plan Trip FAB */}
      <button
        type="button"
        onClick={() => navigate("/tools/buses/plan-trip")}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg active:scale-95 transition-transform"
      >
        <Navigation size={15} />
        Plan Trip
      </button>

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
