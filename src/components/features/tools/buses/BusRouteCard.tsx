import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { GtfsRoute } from "@/types/gtfs";
import { routeBgColor, routeTextColor } from "@/types/gtfs";

interface Props {
  route: GtfsRoute;
}

export function BusRouteCard({ route }: Props) {
  const navigate = useNavigate();
  const bg       = routeBgColor(route.route_color);
  const text     = routeTextColor(route.route_text_color);

  return (
    <button
      type="button"
      onClick={() => navigate(`/tools/buses/route/${route.route_id}`)}
      className="w-full flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3.5 text-left active:bg-muted/30 transition-colors"
    >
      {/* Coloured route number badge */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm leading-none"
        style={{ backgroundColor: bg, color: text }}
      >
        {route.route_short_name ?? '?'}
      </div>

      {/* Route name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {route.route_long_name ?? route.route_short_name ?? 'Route'}
        </p>
        {route.route_desc && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{route.route_desc}</p>
        )}
      </div>

      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
    </button>
  );
}
