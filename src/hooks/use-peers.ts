import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export interface MatchedPeer {
  user_id: string;
  status: string;
  is_mentor: boolean;
  profiles: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    university?: string | null;
  };
}

async function fetchPeers(courseId: string): Promise<MatchedPeer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.functions.invoke("match-study-peers", {
    body: { course_id: courseId },
  });
  if (error) throw error;
  return (data ?? []) as MatchedPeer[];
}

export function usePeers(courseId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["study-peers", courseId, user?.id],
    queryFn: () => fetchPeers(courseId!),
    enabled: !!user && !!courseId,
  });
}
