import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function usePresence(userId: string | undefined) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase || !userId) return;

    const channel = supabase.channel("nestmate-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const ids = new Set(
          Object.values(state).flat().map((p) => p.user_id)
        );
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId });
        }
      });

    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [userId]);

  return onlineUserIds;
}
