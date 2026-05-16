import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDiscoverNotifications,
  markDiscoverNotificationsRead,
} from "@/lib/discover-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export function useDiscoverNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["discover-notifications", user?.id],
    queryFn: () => fetchDiscoverNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!supabase || !user) return;
    const channel = supabase
      .channel("discover-notifications-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "discover_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: ["discover-notifications", user.id] });
        }
      )
      .subscribe();

    return () => { void supabase!.removeChannel(channel); };
  }, [user, qc]);

  const unread = (query.data ?? []).filter((n) => !n.read_at).length;

  const markRead = () => {
    if (!user) return;
    void markDiscoverNotificationsRead(user.id).then(() => {
      void qc.invalidateQueries({ queryKey: ["discover-notifications", user.id] });
    });
  };

  return { ...query, unread, markRead };
}
