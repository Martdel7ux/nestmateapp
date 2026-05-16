import { useQuery } from "@tanstack/react-query";
import { fetchOpportunity } from "@/lib/discover-api";
import { useAuth } from "@/contexts/auth-context";

export function useOpportunity(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["opportunity", id, user?.id],
    queryFn: () => fetchOpportunity(id, user?.id),
    enabled: !!id,
  });
}
