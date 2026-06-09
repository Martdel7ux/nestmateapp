import { useMemo } from "react";
import { useData } from "@/contexts/data-context";
import { computeMatchScore, type MatchResult } from "@/lib/match-score";
import type { FlatmateListing } from "@/types/supabase";

/**
 * Compatibility score between the signed-in user's flatmate listing and a
 * candidate. Returns null when the viewer hasn't created a listing yet (so we
 * can't compare) or for their own card.
 */
export function useMatchScore(them: FlatmateListing | null | undefined): MatchResult | null {
  const { myFlatmateListing } = useData();
  return useMemo(() => {
    if (!myFlatmateListing || !them) return null;
    if (them.user_id === myFlatmateListing.user_id) return null;
    return computeMatchScore(myFlatmateListing, them);
  }, [myFlatmateListing, them]);
}
