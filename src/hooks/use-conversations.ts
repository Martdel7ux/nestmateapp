import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchConversations } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useConversations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-conversations", user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
  });

  // Refresh conversation list when a new study message arrives
  useEffect(() => {
    if (!supabase || !user) return;
    const channel = supabase
      .channel("study-conv-list-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_messages",
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["study-conversations", user.id] });
        }
      )
      .subscribe();

    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [user, qc]);

  return query;
}
