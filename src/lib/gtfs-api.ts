import { supabase } from '@/lib/supabase';
import type {
  GtfsRoute, GtfsStop, GtfsStopWithSeq, GtfsShapePoint,
  NextArrival, RouteAtStop, RouteDirection,
  UserBusFavorite, GtfsStats,
} from '@/types/gtfs';

function sb() {
  if (!supabase) throw new Error('Supabase not initialised');
  return supabase;
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function fetchGtfsRoutes(): Promise<GtfsRoute[]> {
  const { data, error } = await sb()
    .from('bus_routes')
    .select('*')
    .order('route_short_name');
  if (error) throw error;
  return (data ?? []) as GtfsRoute[];
}

export async function fetchGtfsRoute(routeId: string): Promise<GtfsRoute | null> {
  const { data, error } = await sb()
    .from('bus_routes')
    .select('*')
    .eq('route_id', routeId)
    .maybeSingle();
  if (error) throw error;
  return data as GtfsRoute | null;
}

// ── Directions & Stops (via RPC) ──────────────────────────────────────────────

export async function fetchRouteDirections(routeId: string): Promise<RouteDirection[]> {
  const { data, error } = await sb().rpc('get_route_directions', { p_route_id: routeId });
  if (error) throw error;
  return (data ?? []) as RouteDirection[];
}

export async function fetchRouteStopsOrdered(
  routeId:   string,
  direction: number = 0,
): Promise<GtfsStopWithSeq[]> {
  const { data, error } = await sb().rpc('get_route_stops_ordered', {
    p_route_id:  routeId,
    p_direction: direction,
  });
  if (error) throw error;
  return (data ?? []) as GtfsStopWithSeq[];
}

// ── Shape ─────────────────────────────────────────────────────────────────────

export async function fetchRouteShape(
  routeId:   string,
  direction: number = 0,
): Promise<GtfsShapePoint[]> {
  const { data, error } = await sb().rpc('get_route_shape', {
    p_route_id:  routeId,
    p_direction: direction,
  });
  if (error) throw error;
  return (data ?? []) as GtfsShapePoint[];
}

// ── Stop queries ──────────────────────────────────────────────────────────────

export async function fetchGtfsStop(stopId: string): Promise<GtfsStop | null> {
  const { data, error } = await sb()
    .from('bus_stops')
    .select('*')
    .eq('stop_id', stopId)
    .maybeSingle();
  if (error) throw error;
  return data as GtfsStop | null;
}

export async function searchGtfsStops(query: string): Promise<GtfsStop[]> {
  const { data, error } = await sb()
    .from('bus_stops')
    .select('*')
    .ilike('stop_name', `%${query}%`)
    .order('stop_name')
    .limit(30);
  if (error) throw error;
  return (data ?? []) as GtfsStop[];
}

// ── Arrivals (RPC) ────────────────────────────────────────────────────────────

export async function fetchNextArrivals(
  stopId:   string,
  routeId?: string | null,
  limit:    number = 5,
): Promise<NextArrival[]> {
  const { data, error } = await sb().rpc('get_next_bus_arrivals', {
    p_stop_id:  stopId,
    p_route_id: routeId ?? null,
    p_limit:    limit,
  });
  if (error) throw error;
  return (data ?? []) as NextArrival[];
}

export async function fetchRoutesAtStop(stopId: string): Promise<RouteAtStop[]> {
  const { data, error } = await sb().rpc('get_routes_at_stop', { p_stop_id: stopId });
  if (error) throw error;
  return (data ?? []) as RouteAtStop[];
}

// ── User favorites ────────────────────────────────────────────────────────────

export async function fetchUserBusFavorites(userId: string): Promise<UserBusFavorite[]> {
  const { data, error } = await sb()
    .from('user_bus_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserBusFavorite[];
}

export async function addBusFavorite(userId: string, stopId: string): Promise<void> {
  const { error } = await sb()
    .from('user_bus_favorites')
    .insert({ user_id: userId, stop_id: stopId });
  if (error) throw error;
}

export async function removeBusFavorite(userId: string, stopId: string): Promise<void> {
  const { error } = await sb()
    .from('user_bus_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('stop_id', stopId);
  if (error) throw error;
}

// ── Admin stats ───────────────────────────────────────────────────────────────

export async function fetchGtfsStats(): Promise<GtfsStats> {
  const { data, error } = await sb().rpc('get_gtfs_stats');
  if (error) throw error;
  return data as GtfsStats;
}
