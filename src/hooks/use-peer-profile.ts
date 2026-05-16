import { useQuery } from "@tanstack/react-query";
import { fetchPeerProfile } from "@/lib/study-api";

export function usePeerProfile(userId: string) {
  return useQuery({
    queryKey: ["peer-profile", userId],
    queryFn: () => fetchPeerProfile(userId),
    enabled: !!userId,
  });
}
