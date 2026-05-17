import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { Bus } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useBusRoutes } from "@/hooks/use-tools";
import { BusRouteCard } from "@/components/features/tools/buses/BusRouteCard";
import type { UniversityKey } from "@/types/tools";
import { UNIVERSITY_INFO } from "@/types/tools";
import { cn } from "@/lib/utils";

const BusRouteMap = lazy(() =>
  import("@/components/features/tools/buses/BusRouteMap").then((m) => ({ default: m.BusRouteMap }))
);

export function BusRouteDetailPage() {
  const { university } = useParams<{ university: string }>();
  const uni = (university as UniversityKey) ?? "unic";
  const info = UNIVERSITY_INFO[uni] ?? UNIVERSITY_INFO.unic;

  const { data: routes = [], isLoading } = useBusRoutes(uni);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={`${info.name} Bus Routes`} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4">
        {/* University header */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold",
            info.color
          )}>
            {info.name}
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{info.fullName}</p>
            <p className="text-xs text-muted-foreground">{info.city}</p>
          </div>
        </div>

        {/* Map */}
        {!isLoading && routes.length > 0 && (
          <Suspense fallback={
            <div className="rounded-2xl border border-border bg-muted/20 flex items-center justify-center" style={{ height: 240 }}>
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          }>
            <BusRouteMap
              routes={routes}
              centerLat={info.lat}
              centerLon={info.lon}
            />
          </Suspense>
        )}

        {/* Routes list */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && routes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Bus size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No routes found for {info.name}.</p>
          </div>
        )}

        {routes.map((route) => (
          <BusRouteCard key={route.id} route={route} />
        ))}

        {routes.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pb-2">
            Routes curated from OSY and university transport pages · Last verified May 2026
          </p>
        )}
      </div>
    </div>
  );
}
