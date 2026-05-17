import { supabase } from "@/lib/supabase";
import type {
  EacOutage, BusRoute, GarbageSchedule, CyprusDistrict, UniversityKey,
} from "@/types/tools";

function sb() {
  if (!supabase) throw new Error("Supabase not initialized");
  return supabase;
}

// ── EAC Outages ───────────────────────────────────────────────────────────────

export async function fetchUpcomingOutages(district?: CyprusDistrict): Promise<EacOutage[]> {
  let q = sb()
    .from("eac_outages")
    .select("*")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (district) q = q.eq("district", district);
  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data ?? []) as EacOutage[];
}

export async function fetchOutage(id: string): Promise<EacOutage | null> {
  const { data, error } = await sb()
    .from("eac_outages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as EacOutage | null;
}

export async function createOutage(
  patch: Omit<EacOutage, 'id' | 'scraped_at' | 'created_at'>
): Promise<EacOutage> {
  const { data, error } = await sb()
    .from("eac_outages")
    .insert(patch)
    .select()
    .single();
  if (error) throw error;
  return data as EacOutage;
}

export async function updateOutage(id: string, patch: Partial<EacOutage>): Promise<void> {
  const { error } = await sb().from("eac_outages").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteOutage(id: string): Promise<void> {
  const { error } = await sb().from("eac_outages").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchNextOutageForDistrict(
  district: CyprusDistrict
): Promise<EacOutage | null> {
  const { data, error } = await sb()
    .from("eac_outages")
    .select("*")
    .eq("district", district)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as EacOutage | null;
}

// ── Bus Routes ────────────────────────────────────────────────────────────────

export async function fetchBusRoutes(university: UniversityKey): Promise<BusRoute[]> {
  const { data, error } = await sb()
    .from("bus_routes")
    .select("*, stops:bus_route_stops(*)")
    .eq("university", university)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BusRoute[];
}

export async function fetchAllBusRoutes(): Promise<BusRoute[]> {
  const { data, error } = await sb()
    .from("bus_routes")
    .select("*")
    .eq("is_active", true)
    .order("university, display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BusRoute[];
}

export async function createBusRoute(
  patch: Omit<BusRoute, 'id' | 'updated_at' | 'stops'>
): Promise<BusRoute> {
  const { data, error } = await sb()
    .from("bus_routes")
    .insert(patch)
    .select()
    .single();
  if (error) throw error;
  return data as BusRoute;
}

export async function updateBusRoute(id: string, patch: Partial<BusRoute>): Promise<void> {
  const { error } = await sb().from("bus_routes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBusRoute(id: string): Promise<void> {
  const { error } = await sb().from("bus_routes").delete().eq("id", id);
  if (error) throw error;
}

// ── Garbage Schedules ─────────────────────────────────────────────────────────

export async function fetchGarbageSchedules(city: string): Promise<GarbageSchedule[]> {
  const { data, error } = await sb()
    .from("garbage_schedules")
    .select("*")
    .eq("city", city.toLowerCase())
    .order("area", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GarbageSchedule[];
}

export async function fetchGarbageSchedule(
  city: string,
  area: string
): Promise<GarbageSchedule | null> {
  const { data, error } = await sb()
    .from("garbage_schedules")
    .select("*")
    .eq("city", city.toLowerCase())
    .ilike("area", area)
    .maybeSingle();
  if (error) throw error;
  return data as GarbageSchedule | null;
}

export async function fetchAllGarbageSchedules(): Promise<GarbageSchedule[]> {
  const { data, error } = await sb()
    .from("garbage_schedules")
    .select("*")
    .order("city, area", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GarbageSchedule[];
}

export async function upsertGarbageSchedule(
  patch: Omit<GarbageSchedule, 'id' | 'updated_at'>
): Promise<void> {
  const { error } = await sb()
    .from("garbage_schedules")
    .upsert(patch, { onConflict: "city,area" });
  if (error) throw error;
}

export async function deleteGarbageSchedule(id: string): Promise<void> {
  const { error } = await sb().from("garbage_schedules").delete().eq("id", id);
  if (error) throw error;
}
