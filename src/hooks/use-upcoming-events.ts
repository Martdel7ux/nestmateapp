import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchUpcomingEvents,
  saveOpportunity,
  unsaveOpportunity,
  type UpcomingEvent,
} from "@/lib/upcoming-events-api";

const QUERY_KEY = (uid: string | undefined) => ["upcoming-events", uid] as const;

export function useUpcomingEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEY(user?.id),
    queryFn: () => fetchUpcomingEvents(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

export function useToggleEventFavourite(
  opportunityId: string,
  currentlySaved: boolean
) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      currentlySaved
        ? unsaveOpportunity(user!.id, opportunityId)
        : saveOpportunity(user!.id, opportunityId),

    // Optimistic update so the heart flips instantly
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QUERY_KEY(user?.id) });
      const prev = qc.getQueryData<UpcomingEvent[]>(QUERY_KEY(user?.id));
      qc.setQueryData<UpcomingEvent[]>(QUERY_KEY(user?.id), (old) =>
        old?.map((e) =>
          e.id === opportunityId
            ? { ...e, is_favourited: !currentlySaved, is_saved: !currentlySaved }
            : e
        )
      );
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY(user?.id), ctx.prev);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEY(user?.id) });
      // Keep Discover saved list in sync
      void qc.invalidateQueries({ queryKey: ["saved-opportunities"] });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
  });
}
