import { supabase } from "@/lib/supabase";
import { saveOpportunity, unsaveOpportunity } from "@/lib/discover-api";
import type { Opportunity } from "@/types/discover";

export interface UpcomingEvent extends Opportunity {
  is_favourited: boolean;
}

export async function fetchUpcomingEvents(
  userId: string,
  limit = 10
): Promise<UpcomingEvent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_upcoming_events", {
    p_user_id: userId,
    p_limit: limit,
  });
  if (error) {
    console.error("[upcoming-events] RPC error:", error.message);
    return [];
  }
  return (Array.isArray(data) ? data : []) as UpcomingEvent[];
}

export { saveOpportunity, unsaveOpportunity };
