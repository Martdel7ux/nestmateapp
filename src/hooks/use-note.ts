import { useQuery } from "@tanstack/react-query";
import { fetchNote } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";

export function useNote(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNote(id, user?.id),
    enabled: !!id,
  });
}
