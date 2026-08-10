import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/types/supabase";

export interface MyProperty extends Property { saves_count: number; }

export type PropertyStatusTone = "live" | "pending" | "hidden";

/** Human status for a landlord's own listing. */
export function propertyStatus(p: { is_visible: boolean; is_approved: boolean }): { label: string; tone: PropertyStatusTone } {
  if (!p.is_visible) return { label: "Hidden", tone: "hidden" };
  if (!p.is_approved) return { label: "Pending review", tone: "pending" };
  return { label: "Live", tone: "live" };
}

export const STATUS_STYLE: Record<PropertyStatusTone, { bg: string; fg: string }> = {
  live: { bg: "var(--nm-mint-soft)", fg: "#0b7a5a" },
  pending: { bg: "var(--nm-soft)", fg: "var(--nm-accent)" },
  hidden: { bg: "var(--nm-surface2)", fg: "var(--nm-muted)" },
};

/** All properties owned by the landlord (any status), with per-listing save counts. */
export function useMyProperties(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-properties", userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyProperty[]> => {
      if (!supabase || !userId) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const props = (data ?? []) as Property[];

      const ids = props.map((p) => p.id);
      const saves: Record<string, number> = {};
      if (ids.length) {
        const { data: rows } = await supabase.from("property_saves").select("property_id").in("property_id", ids);
        for (const r of (rows ?? []) as { property_id: string }[]) {
          saves[r.property_id] = (saves[r.property_id] ?? 0) + 1;
        }
      }
      return props.map((p) => ({ ...p, saves_count: saves[p.id] ?? 0 }));
    },
  });
}
