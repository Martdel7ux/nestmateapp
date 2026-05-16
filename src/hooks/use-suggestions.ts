import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchSuggestions,
  reviewSuggestion,
  submitEventSuggestion,
} from "@/lib/admin-events-api";
import type { OpportunitySuggestion } from "@/types/discover";

type SuggestionStatusFilter = "pending" | "approved" | "rejected" | "all";

const QK = (s: SuggestionStatusFilter) => ["suggestions", s] as const;

export function useSuggestions(status: SuggestionStatusFilter = "pending") {
  return useQuery({
    queryKey: QK(status),
    queryFn:  () => fetchSuggestions(status),
    staleTime: 30_000,
  });
}

export function useReviewSuggestion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      rejectionReason,
      resultingOpportunityId,
    }: {
      id: string;
      status: "approved" | "rejected";
      rejectionReason?: string;
      resultingOpportunityId?: string;
    }) =>
      reviewSuggestion(id, status, user!.id, {
        rejectionReason,
        resultingOpportunityId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}

export function useSubmitSuggestion() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ url, note }: { url: string; note: string }) =>
      submitEventSuggestion(user!.id, url, note),
  });
}
