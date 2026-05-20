import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import {
  fetchGtfsRoutes, fetchGtfsRoute,
  fetchRouteDirections, fetchRouteStopsOrdered, fetchRouteShape,
  fetchGtfsStop, searchGtfsStops,
  fetchNextArrivals, fetchRoutesAtStop,
  fetchUserBusFavorites, addBusFavorite, removeBusFavorite,
  fetchGtfsStats, planDirectTrip,
} from '@/lib/gtfs-api';

export const gtfsKeys = {
  routes:       ()                          => ['gtfs', 'routes']               as const,
  route:        (id: string)                => ['gtfs', 'route', id]            as const,
  directions:   (id: string)                => ['gtfs', 'directions', id]       as const,
  routeStops:   (id: string, dir: number)   => ['gtfs', 'route-stops', id, dir] as const,
  routeShape:   (id: string, dir: number)   => ['gtfs', 'route-shape', id, dir] as const,
  stop:         (id: string)                => ['gtfs', 'stop', id]             as const,
  stopSearch:   (q: string)                 => ['gtfs', 'stop-search', q]       as const,
  nextArrivals: (id: string)                => ['gtfs', 'arrivals', id]         as const,
  routesAtStop: (id: string)                => ['gtfs', 'routes-at-stop', id]   as const,
  favorites:    ()                          => ['gtfs', 'favorites']            as const,
  stats:        ()                          => ['gtfs', 'stats']                as const,
};

// ── Routes ────────────────────────────────────────────────────────────────────

export function useGtfsRoutes() {
  return useQuery({
    queryKey: gtfsKeys.routes(),
    queryFn:  fetchGtfsRoutes,
    staleTime: 60 * 60 * 1000,
  });
}

export function useGtfsRoute(routeId: string | undefined) {
  return useQuery({
    queryKey: gtfsKeys.route(routeId ?? ''),
    queryFn:  () => fetchGtfsRoute(routeId!),
    enabled:  !!routeId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useRouteDirections(routeId: string | undefined) {
  return useQuery({
    queryKey: gtfsKeys.directions(routeId ?? ''),
    queryFn:  () => fetchRouteDirections(routeId!),
    enabled:  !!routeId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useRouteStops(routeId: string | undefined, direction: number = 0) {
  return useQuery({
    queryKey: gtfsKeys.routeStops(routeId ?? '', direction),
    queryFn:  () => fetchRouteStopsOrdered(routeId!, direction),
    enabled:  !!routeId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useRouteShape(routeId: string | undefined, direction: number = 0) {
  return useQuery({
    queryKey: gtfsKeys.routeShape(routeId ?? '', direction),
    queryFn:  () => fetchRouteShape(routeId!, direction),
    enabled:  !!routeId,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

// ── Stops ─────────────────────────────────────────────────────────────────────

export function useGtfsStop(stopId: string | undefined) {
  return useQuery({
    queryKey: gtfsKeys.stop(stopId ?? ''),
    queryFn:  () => fetchGtfsStop(stopId!),
    enabled:  !!stopId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useStopSearch(query: string) {
  return useQuery({
    queryKey: gtfsKeys.stopSearch(query),
    queryFn:  () => searchGtfsStops(query),
    enabled:  query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Arrivals ──────────────────────────────────────────────────────────────────

export function useNextArrivals(stopId: string | undefined) {
  return useQuery({
    queryKey:       gtfsKeys.nextArrivals(stopId ?? ''),
    queryFn:        () => fetchNextArrivals(stopId!),
    enabled:        !!stopId,
    staleTime:      25 * 1000,
    refetchInterval: 30 * 1000, // auto-refresh every 30 s
  });
}

export function useRoutesAtStop(stopId: string | undefined) {
  return useQuery({
    queryKey: gtfsKeys.routesAtStop(stopId ?? ''),
    queryFn:  () => fetchRoutesAtStop(stopId!),
    enabled:  !!stopId,
    staleTime: 60 * 60 * 1000,
  });
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export function useBusFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: gtfsKeys.favorites(),
    queryFn:  () => fetchUserBusFavorites(user!.id),
    enabled:  !!user,
  });
}

export function useToggleBusFavorite() {
  const { user } = useAuth();
  const qc       = useQueryClient();
  return useMutation({
    mutationFn: ({ stopId, isFav }: { stopId: string; isFav: boolean }) => {
      if (!user) throw new Error('Not logged in');
      return isFav ? removeBusFavorite(user.id, stopId) : addBusFavorite(user.id, stopId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gtfsKeys.favorites() }),
  });
}

// ── Trip planner ──────────────────────────────────────────────────────────────

export function useTripPlanner(
  from: [number, number] | null,
  to:   [number, number] | null,
) {
  return useQuery({
    queryKey: ['gtfs', 'trip-planner', from, to],
    queryFn:  () => planDirectTrip(from![0], from![1], to![0], to![1]),
    enabled:  !!from && !!to,
    staleTime: 60 * 1000, // 1 min — results change as buses depart
  });
}

// ── Admin stats ───────────────────────────────────────────────────────────────

export function useGtfsStats() {
  return useQuery({
    queryKey: gtfsKeys.stats(),
    queryFn:  fetchGtfsStats,
    staleTime: 5 * 60 * 1000,
  });
}
