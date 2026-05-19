import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSavedOpportunities,
  saveOpportunity,
  unsaveOpportunity,
} from "@/lib/discover-api";
import { useAuth } from "@/contexts/auth-context";
import type { Opportunity } from "@/types/discover";

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
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["opportunity", opportunityId] });
      await qc.cancelQueries({ queryKey: ["opportunities"] });
      await qc.cancelQueries({ queryKey: ["saved-opportunities", user?.id] });

      const prevOpportunity = qc.getQueryData<Opportunity>(["opportunity", opportunityId]);
      const prevOpportunities = qc.getQueriesData<Opportunity[]>({ queryKey: ["opportunities"] });
      const prevSaved = qc.getQueryData<Opportunity[]>(["saved-opportunities", user?.id]);

      if (prevOpportunity) {
        qc.setQueryData<Opportunity>(["opportunity", opportunityId], {
          ...prevOpportunity,
          is_saved: !currentlySaved,
        });
      }

      qc.setQueriesData<Opportunity[]>({ queryKey: ["opportunities"] }, (old) =>
        old?.map((o) => o.id === opportunityId ? { ...o, is_saved: !currentlySaved } : o)
      );

      if (prevSaved && currentlySaved) {
        qc.setQueryData<Opportunity[]>(
          ["saved-opportunities", user?.id],
          prevSaved.filter((o) => o.id !== opportunityId)
        );
      }

      return { prevOpportunity, prevOpportunities, prevSaved };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevOpportunity) {
        qc.setQueryData(["opportunity", opportunityId], context.prevOpportunity);
      }
      if (context?.prevOpportunities) {
        for (const [key, data] of context.prevOpportunities) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.prevSaved) {
        qc.setQueryData(["saved-opportunities", user?.id], context.prevSaved);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      void qc.invalidateQueries({ queryKey: ["saved-opportunities"] });
    },
  });
}
