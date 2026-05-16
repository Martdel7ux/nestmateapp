import { supabase } from "@/lib/supabase";
import type {
  Opportunity,
  OpportunityFilters,
  UserOpportunityPreferences,
  DiscoverNotification,
} from "@/types/discover";

const PAGE_SIZE = 20;

export async function fetchOpportunities(
  filters: OpportunityFilters,
  page: number,
  userId?: string
): Promise<Opportunity[]> {
  if (!supabase) return [];
  let q = supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (filters.type) q = q.eq("type", filters.type);
  if (filters.location_type) q = q.eq("location_type", filters.location_type);
  if (filters.query?.trim()) q = q.ilike("title", `%${filters.query.trim()}%`);
  if (filters.tags?.length) q = q.overlaps("tags", filters.tags);

  const { data } = await q;
  const rows = (data ?? []) as Opportunity[];

  if (!userId || rows.length === 0) return rows;

  const ids = rows.map((r) => r.id);
  const { data: saves } = await supabase
    .from("user_opportunity_saves")
    .select("opportunity_id")
    .eq("user_id", userId)
    .in("opportunity_id", ids);

  const savedSet = new Set((saves ?? []).map((s: { opportunity_id: string }) => s.opportunity_id));
  return rows.map((r) => ({ ...r, is_saved: savedSet.has(r.id) }));
}

export async function fetchOpportunity(id: string, userId?: string): Promise<Opportunity | null> {
  if (!supabase) return null;
  const { data } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const opp = data as Opportunity;

  if (!userId) return opp;
  const { data: save } = await supabase
    .from("user_opportunity_saves")
    .select("opportunity_id")
    .eq("user_id", userId)
    .eq("opportunity_id", id)
    .maybeSingle();
  return { ...opp, is_saved: !!save };
}

export async function fetchSavedOpportunities(userId: string): Promise<Opportunity[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_opportunity_saves")
    .select("opportunity_id, opportunities(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  return (data ?? []).map((row: { opportunities: unknown }) => ({
    ...(row.opportunities as Opportunity),
    is_saved: true,
  }));
}

export async function saveOpportunity(userId: string, opportunityId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("user_opportunity_saves")
    .upsert({ user_id: userId, opportunity_id: opportunityId });
}

export async function unsaveOpportunity(userId: string, opportunityId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("user_opportunity_saves")
    .delete()
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId);
}

export async function fetchPreferences(userId: string): Promise<UserOpportunityPreferences | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("user_opportunity_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserOpportunityPreferences) ?? null;
}

export async function upsertPreferences(
  userId: string,
  prefs: Partial<UserOpportunityPreferences>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("user_opportunity_preferences")
    .upsert({ ...prefs, user_id: userId });
}

export async function fetchDiscoverNotifications(userId: string): Promise<DiscoverNotification[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("discover_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as DiscoverNotification[];
}

export async function markDiscoverNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("discover_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
