import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/contexts/i18n-context";
import {
  Navigation, MapPin, X, Loader2, AlertCircle,
  Bus, ChevronRight, Star, Search, LocateFixed, List,
} from "lucide-react";
import {
  useGtfsRoutes, useBusFavorites, useNextArrivals,
  useGtfsStop, useToggleBusFavorite, useStopSearch, useTripPlanner,
} from "@/hooks/use-gtfs";
import { BusRouteCard } from "@/components/features/tools/buses/BusRouteCard";
import { TripResultCard } from "@/components/features/tools/buses/TripResultCard";
import { AppHeader } from "@/components/layout/app-header";
import { StopArrivalsSheet } from "@/components/features/tools/buses/StopArrivalsSheet";
import type { GtfsRoute, GtfsStop } from "@/types/gtfs";
import { routeBgColor } from "@/types/gtfs";
import { cn } from "@/lib/utils";

const NICOSIA_CENTER: [number, number] = [35.1706, 33.3589];
type GpsState = "detecting" | "found" | "denied";

// ── Saved stop row ────────────────────────────────────────────────────────────

function FavoriteStopRow({
  stopId,
  onOpen,
}: {
  stopId: string;
  onOpen: (id: string, name: string) => void;
}) {
  const { t } = useI18n();
  const { data: stop }                = useGtfsStop(stopId);
  const { data: arrivals = [] }       = useNextArrivals(stopId);
  const { mutate: toggle, isPending } = useToggleBusFavorite();

  if (!stop) return <div className="rounded-2xl border border-border bg-muted/20 p-4 h-20 animate-pulse" />;

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
                  <div key={i} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1"
                    style={{ backgroundColor: `${bg}18`, border: `1px solid ${bg}40` }}>
                    <span className="text-xs font-bold" style={{ color: bg }}>{a.route_short_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.minutes_until <= 0 ? t("busesNow") : `${a.minutes_until} ${t("busesMin")}`}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">{t("busesNoMoreToday")}</p>
          )}
        </div>
        <button type="button"
          onClick={(e) => { e.stopPropagation(); toggle({ stopId, isFav: true }); }}
          disabled={isPending}
          className="shrink-0 text-amber-500 p-1">
          <Star size={16} fill="currentColor" />
        </button>
      </div>
    </button>
  );
}

// ── All Routes modal (full-screen slide-up) ───────────────────────────────────

function RoutesModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [query, setQuery]           = useState("");
  const { data: routes = [], isLoading } = useGtfsRoutes();

  const filtered = useMemo<GtfsRoute[]>(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.route_short_name?.toLowerCase().includes(q) ||
        r.route_long_name?.toLowerCase().includes(q),
    );
  }, [routes, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onPointerDown={onClose}
      />
      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 bottom-0 top-16 z-50 flex flex-col rounded-t-3xl bg-background overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <h2 className="text-base font-bold text-foreground">{t("busesAllRoutes")}</h2>
          <button type="button" onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/40">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder={t("busesSearchRoute")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
          {isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bus size={36} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {query ? t("busesNoRoutes") : t("busesNoRoutes")}
              </p>
            </div>
          )}
          {filtered.map((route) => (
            <BusRouteCard key={route.route_id} route={route} />
          ))}
          {!isLoading && routes.length > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
              {routes.length} Nicosia routes · OSY GTFS data
            </p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BusesPage() {
  const { t } = useI18n();
  // ── GPS ────────────────────────────────────────────────────────────────────
  const [gpsState,  setGpsState]  = useState<GpsState>("detecting");
  const [gpsCoords, setGpsCoords] = useState<[number, number]>(NICOSIA_CENTER);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsState("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords([pos.coords.latitude, pos.coords.longitude]);
        setGpsState("found");
      },
      () => setGpsState("denied"),
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: true },
    );
  }, []);

  // ── From field ─────────────────────────────────────────────────────────────
  const [fromMode,         setFromMode]         = useState<"gps" | "stop">("gps");
  const [fromStop,         setFromStop]         = useState<GtfsStop | null>(null);
  const [fromQuery,        setFromQuery]        = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const fromInputRef    = useRef<HTMLInputElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);

  const { data: fromSuggestions = [], isFetching: fromFetching } = useStopSearch(fromQuery);

  const fromCoords: [number, number] =
    fromMode === "stop" && fromStop
      ? [fromStop.stop_lat, fromStop.stop_lon]
      : gpsCoords;

  function selectFromStop(stop: GtfsStop) {
    setFromStop(stop); setFromMode("stop");
    setFromQuery(stop.stop_name);
    setShowFromDropdown(false);
    fromInputRef.current?.blur();
  }

  function resetToGps() {
    setFromMode("gps"); setFromStop(null);
    setFromQuery(""); setShowFromDropdown(false);
  }

  // ── To field ───────────────────────────────────────────────────────────────
  const [toStop,         setToStop]         = useState<GtfsStop | null>(null);
  const [toQuery,        setToQuery]        = useState("");
  const [showToDropdown, setShowToDropdown] = useState(false);
  const toInputRef    = useRef<HTMLInputElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  const { data: toSuggestions = [], isFetching: toFetching } = useStopSearch(toQuery);

  function selectToStop(stop: GtfsStop) {
    setToStop(stop); setToQuery(stop.stop_name);
    setShowToDropdown(false); toInputRef.current?.blur();
  }

  function clearTo() {
    setToStop(null); setToQuery("");
    setShowToDropdown(false);
    setTimeout(() => toInputRef.current?.focus(), 50);
  }

  // ── Trip results ───────────────────────────────────────────────────────────
  const toCoords: [number, number] | null = toStop
    ? [toStop.stop_lat, toStop.stop_lon]
    : null;

  const {
    data: trips = [],
    isLoading: tripsLoading,
    isError:   tripsError,
    error:     tripsErrorObj,
    isFetched: tripsFetched,
    refetch:   refetchTrips,
  } = useTripPlanner(fromCoords, toCoords);

  const errorMessage = tripsErrorObj instanceof Error
    ? tripsErrorObj.message
    : "Check that plan_direct_trip is deployed in Supabase";

  // ── Other state ────────────────────────────────────────────────────────────
  const [sheetStop,      setSheetStop]      = useState<{ id: string; name: string } | null>(null);
  const [showAllRoutes,  setShowAllRoutes]  = useState(false);
  const { data: favorites = [] }            = useBusFavorites();

  // ── Close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(t) &&
          fromInputRef.current   && !fromInputRef.current.contains(t))
        setShowFromDropdown(false);
      if (toDropdownRef.current && !toDropdownRef.current.contains(t) &&
          toInputRef.current    && !toInputRef.current.contains(t))
        setShowToDropdown(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("busesTitle")} />

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── Trip planner card ── */}
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-border bg-background/60 overflow-visible">

            {/* From row */}
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60">
                <Navigation
                  size={16}
                  className={cn(
                    "shrink-0 transition-colors",
                    fromMode === "stop"                              && "text-muted-foreground",
                    fromMode === "gps" && gpsState === "detecting"  && "text-muted-foreground animate-pulse",
                    fromMode === "gps" && gpsState === "found"      && "text-primary",
                    fromMode === "gps" && gpsState === "denied"     && "text-amber-500",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-none mb-1">{t("busesFrom")}</p>
                  {fromMode === "gps" ? (
                    <button
                      type="button"
                      onClick={() => { setFromMode("stop"); setTimeout(() => fromInputRef.current?.focus(), 50); }}
                      className="w-full text-left text-sm font-semibold text-foreground truncate"
                    >
                      {gpsState === "detecting" && "Getting your location…"}
                      {gpsState === "found"     && "Your current location"}
                      {gpsState === "denied"    && "Nicosia city centre · tap to change"}
                    </button>
                  ) : (
                    <input
                      ref={fromInputRef}
                      type="search"
                      placeholder="Search a starting stop…"
                      value={fromQuery}
                      onChange={(e) => {
                        setFromQuery(e.target.value);
                        setShowFromDropdown(true);
                        if (fromStop && e.target.value !== fromStop.stop_name) setFromStop(null);
                      }}
                      onFocus={() => { if (fromQuery.trim().length >= 2) setShowFromDropdown(true); }}
                      className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none"
                    />
                  )}
                </div>
                {fromFetching && !fromStop && fromMode === "stop" && (
                  <Loader2 size={13} className="shrink-0 text-muted-foreground animate-spin" />
                )}
                {fromMode === "stop" && (
                  <button type="button" onClick={resetToGps}
                    className="shrink-0 flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
                    <LocateFixed size={12} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">{t("busesGPS")}</span>
                  </button>
                )}
              </div>

              {/* From dropdown */}
              {showFromDropdown && fromSuggestions.length > 0 && !fromStop && (
                <div ref={fromDropdownRef}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg">
                  {fromSuggestions.map((stop) => (
                    <button key={stop.stop_id} type="button"
                      onPointerDown={(e) => { e.preventDefault(); selectFromStop(stop); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 first:rounded-t-2xl last:rounded-b-2xl">
                      <Bus size={13} className="shrink-0 text-muted-foreground" />
                      <p className="flex-1 text-sm text-foreground truncate">{stop.stop_name}</p>
                      <ChevronRight size={13} className="shrink-0 text-muted-foreground/50" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* To row */}
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <MapPin size={16} className="shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-none mb-1">{t("busesTo")}</p>
                  <input
                    ref={toInputRef}
                    type="search"
                    placeholder="Search destination stop…"
                    value={toQuery}
                    onChange={(e) => {
                      setToQuery(e.target.value);
                      setShowToDropdown(true);
                      if (toStop && e.target.value !== toStop.stop_name) setToStop(null);
                    }}
                    onFocus={() => { if (toQuery.trim().length >= 2) setShowToDropdown(true); }}
                    className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 outline-none"
                  />
                </div>
                {toFetching && !toStop && (
                  <Loader2 size={13} className="shrink-0 text-muted-foreground animate-spin" />
                )}
                {(toQuery || toStop) && (
                  <button type="button" onClick={clearTo} className="shrink-0 text-muted-foreground p-0.5">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* To dropdown */}
              {showToDropdown && toSuggestions.length > 0 && !toStop && (
                <div ref={toDropdownRef}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg">
                  {toSuggestions.map((stop) => (
                    <button key={stop.stop_id} type="button"
                      onPointerDown={(e) => { e.preventDefault(); selectToStop(stop); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 first:rounded-t-2xl last:rounded-b-2xl">
                      <Bus size={13} className="shrink-0 text-muted-foreground" />
                      <p className="flex-1 text-sm text-foreground truncate">{stop.stop_name}</p>
                      <ChevronRight size={13} className="shrink-0 text-muted-foreground/50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Trip results ── */}
        {toStop && (
          <div className="px-4 pt-3 space-y-3">
            {tripsLoading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 size={20} className="text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">{t("busesFinding")}</p>
              </div>
            )}

            {tripsError && !tripsLoading && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle size={24} className="text-destructive/70" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("busesNoRoutes")}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
                </div>
                <button type="button" onClick={() => refetchTrips()}
                  className="rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  {t("busesTryAgain")}
                </button>
              </div>
            )}

            {tripsFetched && !tripsLoading && !tripsError && trips.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bus size={28} className="text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">{t("busesNoDirectRoutes")}</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  No buses connect these stops right now. Try a stop closer to your destination.
                </p>
              </div>
            )}

            {!tripsLoading && trips.map((trip, i) => (
              <TripResultCard key={`${trip.route_id}-${trip.departure_time}-${i}`} trip={trip} />
            ))}

            {!tripsLoading && trips.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pb-1">
                {trips.length} direct {trips.length === 1 ? "trip" : "trips"} · Updates every minute
              </p>
            )}
          </div>
        )}

        {/* ── My Stops section ── */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">{t("busesMyStops")}</h2>
            {favorites.length > 0 && (
              <span className="text-xs text-muted-foreground">{favorites.length} saved</span>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <Star size={24} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">{t("busesNoSavedStops")}</p>
              <p className="text-xs text-muted-foreground">
                Open a route, tap any stop, then ★ to save it here for quick access
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <FavoriteStopRow
                  key={fav.stop_id}
                  stopId={fav.stop_id}
                  onOpen={(id, name) => setSheetStop({ id, name })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 px-4 mt-6">
          <div className="flex-1 border-t border-border/60" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 border-t border-border/60" />
        </div>

        {/* ── Browse all routes ── */}
        <div className="px-4 mt-4 mb-2">
          <button
            type="button"
            onClick={() => setShowAllRoutes(true)}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-muted/30 py-4 text-sm font-semibold text-foreground hover:bg-muted/50 active:bg-muted/60 transition-colors"
          >
            <List size={16} className="text-muted-foreground" />
            {t("busesViewAllRoutes")}
          </button>
        </div>
      </div>

      {/* ── Modals / sheets ── */}
      <AnimatePresence>
        {showAllRoutes && (
          <RoutesModal onClose={() => setShowAllRoutes(false)} />
        )}
      </AnimatePresence>

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
