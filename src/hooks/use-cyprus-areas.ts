import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CyprusArea {
  id: string;
  city: string;
  area_name: string;
  area_name_greek: string | null;
  display_order: number;
  is_active: boolean;
}

export function useCyprusAreas(cityKey?: string | null) {
  return useQuery<CyprusArea[]>({
    queryKey: ["cyprusAreas", cityKey ?? "all"],
    queryFn: async () => {
      if (!supabase) return [];
      let q = supabase
        .from("cyprus_areas")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (cityKey) q = q.eq("city", cityKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CyprusArea[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour — static-ish data
    enabled: true,
  });
}
