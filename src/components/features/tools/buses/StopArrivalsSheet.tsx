import { useEffect, useRef } from "react";
import { X, Star, RefreshCw, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNextArrivals, useBusFavorites, useToggleBusFavorite } from "@/hooks/use-gtfs";
import { routeBgColor, routeTextColor, formatMinutesUntil } from "@/types/gtfs";
import { cn } from "@/lib/utils";

interface Props {
  stopId:   string;
  stopName: string;
  onClose:  () => void;
}

export function StopArrivalsSheet({ stopId, stopName, onClose }: Props) {
  const { data: arrivals = [], isLoading, dataUpdatedAt, refetch } = useNextArrivals(stopId);
  const { data: favorites = [] } = useBusFavorites();
  const { mutate: toggle, isPending } = useToggleBusFavorite();

  const isFav = favorites.some((f) => f.stop_id === stopId);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on backdrop tap
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <AnimatePresence>
      <div
        ref={backdropRef}
        onClick={handleBackdrop}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background border-t border-border shadow-2xl max-h-[75vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-start gap-3 px-5 pt-2 pb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bus Stop</p>
              <p className="text-lg font-bold text-foreground leading-tight mt-0.5">{stopName}</p>
            </div>

            {/* Save button */}
            <button
              type="button"
              onClick={() => toggle({ stopId, isFav })}
              disabled={isPending}
              className={cn(
                "flex items-center justify-center h-9 w-9 rounded-xl border transition-all",
                isFav
                  ? "border-amber-400 bg-amber-400/10 text-amber-500"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-muted/30 text-muted-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* Arrivals */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}

            {!isLoading && arrivals.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Clock size={32} className="text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No more buses today</p>
                <p className="text-xs text-muted-foreground/70">Check back tomorrow</p>
              </div>
            )}

            {arrivals.map((arrival, idx) => {
              const bg   = routeBgColor(arrival.route_color);
              const text = routeTextColor(arrival.route_text_color);
              const mins = arrival.minutes_until;

              return (
                <div
                  key={`${arrival.route_id}-${idx}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3.5"
                >
                  {/* Route badge */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {arrival.route_short_name ?? '?'}
                  </div>

                  {/* Headsign */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {arrival.trip_headsign ?? arrival.route_long_name ?? ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {arrival.arrival_time.slice(0, 5)}
                    </p>
                  </div>

                  {/* Countdown */}
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
                </div>
              );
            })}
          </div>

          {/* Footer: last updated + refresh */}
          {lastUpdated && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Updated {lastUpdated}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-xs text-primary font-semibold"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
