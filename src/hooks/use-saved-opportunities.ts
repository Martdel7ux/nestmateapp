import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSavedOpportunities,
  saveOpportunity,
  unsaveOpportunity,
} from "@/lib/discover-api";
import { useAuth } from "@/contexts/auth-context";

export function useSavedOpportunities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-opportunities", user?.id],
    queryFn: () => fetchSavedOpportunities(user!.id),
    enabled: !!user,
  });
}

export function useToggleSave(opportunityId: string, currentlySaved: boolean) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      currentlySaved
        ? unsaveOpportunity(user!.id, opportunityId)
        : saveOpportunity(user!.id, opportunityId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      void qc.invalidateQueries({ queryKey: ["saved-opportunities"] });
    },
  });
}
