import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchOpportunities } from "@/lib/discover-api";
import type { OpportunityFilters } from "@/types/discover";
import { useAuth } from "@/contexts/auth-context";

export function useOpportunities(filters: OpportunityFilters) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["opportunities", filters, user?.id],
    queryFn: ({ pageParam }) =>
      fetchOpportunities(filters, pageParam as number, user?.id),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length : undefined,
  });
}
