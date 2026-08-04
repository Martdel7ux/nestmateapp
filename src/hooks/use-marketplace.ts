import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchMarketplaceListings,
  createMarketplaceListing,
  fetchPerks,
} from "@/lib/marketplace-api";

// retry: 0 so that if the tables aren't migrated yet the UI falls straight to
// its empty state instead of hammering a missing relation.
export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: fetchMarketplaceListings,
    retry: 0,
    staleTime: 60_000,
  });
}

export function useCreateMarketplaceListing() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; price: number; category: string; description?: string; city?: string; imageFile?: File | null }) =>
      createMarketplaceListing({ ...input, sellerId: user!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marketplace-listings"] }),
  });
}

export function usePerks() {
  return useQuery({
    queryKey: ["student-perks"],
    queryFn: fetchPerks,
    retry: 0,
    staleTime: 5 * 60_000,
  });
}
