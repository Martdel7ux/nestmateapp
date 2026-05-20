import { useEffect, useRef, useState } from "react";
import {
  Navigation, MapPin, X, Loader2,
  AlertCircle, Bus, ChevronRight, LocateFixed,
} from "lucide-react";
import { useStopSearch, useTripPlanner } from "@/hooks/use-gtfs";
import { TripResultCard } from "@/components/features/tools/buses/TripResultCard";
import { AppHeader } from "@/components/layout/app-header";
import type { GtfsStop } from "@/types/gtfs";
import { cn } from "@/lib/utils";

const NICOSIA_CENTER: [number, number] = [35.1706, 33.3589];

type GpsState = "detecting" | "found" | "denied";

export function TripPlannerPage() {
  // ── GPS ──────────────────────────────────────────────────────────────────────
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

  // ── From field ────────────────────────────────────────────────────────────────
  // "gps" = use live gpsCoords; "stop" = user picked a specific stop
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
    setFromStop(stop);
    setFromMode("stop");
    setFromQuery(stop.stop_name);
    setShowFromDropdown(false);
    fromInputRef.current?.blur();
  }

  function resetToGps() {
    setFromMode("gps");
    setFromStop(null);
    setFromQuery("");
    setShowFromDropdown(false);
  }

  // ── To field ──────────────────────────────────────────────────────────────────
  const [toStop,       setToStop]       = useState<GtfsStop | null>(null);
  const [toQuery,      setToQuery]      = useState("");
  const [showToDropdown, setShowToDropdown] = useState(false);
  const toInputRef    = useRef<HTMLInputElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  const { data: toSuggestions = [], isFetching: toFetching } = useStopSearch(toQuery);

  function selectToStop(stop: GtfsStop) {
    setToStop(stop);
    setToQuery(stop.stop_name);
    setShowToDropdown(false);
    toInputRef.current?.blur();
  }

  function clearTo() {
    setToStop(null);
    setToQuery("");
    setShowToDropdown(false);
    setTimeout(() => toInputRef.current?.focus(), 50);
  }

  // ── Trip results ─────────────────────────────────────────────────────────────
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
    : "Check that the plan_direct_trip SQL function is deployed in Supabase";

  // ── Close dropdowns on outside click ─────────────────────────────────────────
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(t) &&
          fromInputRef.current   && !fromInputRef.current.contains(t)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(t) &&
          toInputRef.current    && !toInputRef.current.contains(t)) {
        setShowToDropdown(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Plan Trip" />

      <div className="px-4 mt-3 space-y-2">

        {/* ── From ── */}
        <div className="relative">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/60 px-4 py-3">
            <Navigation
              size={15}
              className={cn(
                "shrink-0 transition-colors",
                fromMode === "stop"              && "text-muted-foreground",
                fromMode === "gps" && gpsState === "detecting" && "text-muted-foreground animate-pulse",
                fromMode === "gps" && gpsState === "found"     && "text-primary",
                fromMode === "gps" && gpsState === "denied"    && "text-amber-500",
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">From</p>
              {fromMode === "gps" ? (
                /* GPS mode — tapping opens the field for manual override */
                <button
                  type="button"
                  onClick={() => {
                    setFromMode("stop");
                    setTimeout(() => { fromInputRef.current?.focus(); }, 50);
                  }}
                  className="w-full text-left text-sm font-semibold text-foreground truncate"
                >
                  {gpsState === "detecting" && "Getting your location…"}
                  {gpsState === "found"     && "Your current location"}
                  {gpsState === "denied"    && "Nicosia city centre (tap to change)"}
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

            {/* Right action */}
            {fromFetching && !fromStop && fromMode === "stop" && (
              <Loader2 size={14} className="shrink-0 text-muted-foreground animate-spin" />
            )}
            {fromMode === "stop" ? (
              <button
                type="button"
                onClick={resetToGps}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1"
                title="Use my location"
              >
                <LocateFixed size={12} className="text-primary" />
                <span className="text-xs font-semibold text-primary">GPS</span>
              </button>
            ) : null}
          </div>

          {/* From suggestions dropdown */}
          {showFromDropdown && fromSuggestions.length > 0 && !fromStop && (
            <div
              ref={fromDropdownRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg"
            >
              {fromSuggestions.map((stop) => (
                <button
                  key={stop.stop_id}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); selectFromStop(stop); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 active:bg-muted/60 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <Bus size={13} className="shrink-0 text-muted-foreground" />
                  <p className="flex-1 text-sm text-foreground truncate">{stop.stop_name}</p>
                  <ChevronRight size={13} className="shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── To ── */}
        <div className="relative">
          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/60 px-4 py-3">
            <MapPin size={15} className="shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">To</p>
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
              <Loader2 size={14} className="shrink-0 text-muted-foreground animate-spin" />
            )}
            {(toQuery || toStop) && (
              <button type="button" onClick={clearTo} className="shrink-0 text-muted-foreground p-0.5">
                <X size={15} />
              </button>
            )}
          </div>

          {/* To suggestions dropdown */}
          {showToDropdown && toSuggestions.length > 0 && !toStop && (
            <div
              ref={toDropdownRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-background shadow-lg"
            >
              {toSuggestions.map((stop) => (
                <button
                  key={stop.stop_id}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); selectToStop(stop); }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 active:bg-muted/60 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <Bus size={13} className="shrink-0 text-muted-foreground" />
                  <p className="flex-1 text-sm text-foreground truncate">{stop.stop_name}</p>
                  <ChevronRight size={13} className="shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results area ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3">

        {/* Prompt */}
        {!toStop && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bus size={28} className="text-primary" />
            </div>
            <p className="text-base font-bold text-foreground">Where are you going?</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Search a destination stop above. You can also tap <strong>From</strong> to set your starting stop manually.
            </p>
          </div>
        )}

        {/* Loading */}
        {toStop && tripsLoading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Finding buses…</p>
          </div>
        )}

        {/* Error */}
        {toStop && tripsError && !tripsLoading && (
          <div className="flex flex-col items-center gap-4 py-12 text-center px-2">
            <AlertCircle size={28} className="text-destructive/70" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Could not fetch routes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => refetchTrips()}
              className="rounded-xl bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"
            >
              Try again
            </button>
          </div>
        )}

        {/* No results */}
        {toStop && tripsFetched && !tripsLoading && !tripsError && trips.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
              <Bus size={24} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground">No direct routes found</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              No buses run directly between these stops right now.
              Try a stop closer to your destination, or check back later.
            </p>
          </div>
        )}

        {/* Trip cards */}
        {toStop && !tripsLoading && trips.map((trip, i) => (
          <TripResultCard key={`${trip.route_id}-${trip.departure_time}-${i}`} trip={trip} />
        ))}

        {toStop && !tripsLoading && trips.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            {trips.length} direct {trips.length === 1 ? "trip" : "trips"} · Updates every minute
          </p>
        )}
      </div>
    </div>
  );
}
