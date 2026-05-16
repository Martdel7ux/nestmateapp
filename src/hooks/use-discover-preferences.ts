import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPreferences, upsertPreferences } from "@/lib/discover-api";
import type { UserOpportunityPreferences } from "@/types/discover";
import { useAuth } from "@/contexts/auth-context";

export function useDiscoverPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["discover-preferences", user?.id],
    queryFn: () => fetchPreferences(user!.id),
    enabled: !!user,
  });
}

export function useUpdateDiscoverPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<UserOpportunityPreferences>) =>
      upsertPreferences(user!.id, prefs),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["discover-preferences"] });
    },
  });
}
