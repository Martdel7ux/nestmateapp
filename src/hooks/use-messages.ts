import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, sendStudyMessage } from "@/lib/study-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { StudyMessage, StudyMessageConvType } from "@/types/study";

export function useMessages(conversationId: string, convType: StudyMessageConvType) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["study-messages", conversationId, convType],
    queryFn: () => fetchMessages(conversationId, convType),
    enabled: !!conversationId,
  });

  // Realtime subscription — matches use-discover-notifications.ts pattern
  useEffect(() => {
    if (!supabase || !conversationId) return;

    const channel = supabase
      .channel("study-messages-" + conversationId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as StudyMessage;
          qc.setQueryData<StudyMessage[]>(
            ["study-messages", conversationId, convType],
            (old) => {
              if (!old) return [newMsg];
              // Avoid duplicates from own mutations
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "study_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void qc.invalidateQueries({
            queryKey: ["study-messages", conversationId, convType],
          });
        }
      )
      .subscribe();

    return () => {
      void supabase!.removeChannel(channel);
    };
  }, [conversationId, convType, qc]);

  // Suppress unused variable warning
  void user;

  return query;
}

export function useSendMessage(conversationId: string, convType: StudyMessageConvType) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      content,
      attachment_url,
    }: {
      content: string;
      attachment_url?: string;
    }) =>
      sendStudyMessage({
        conversation_id: conversationId,
        conversation_type: convType,
        sender_id: user!.id,
        content,
        attachment_url,
      }),
    onMutate: async ({ content, attachment_url }) => {
      await qc.cancelQueries({ queryKey: ["study-messages", conversationId, convType] });
      const prevMessages = qc.getQueryData<StudyMessage[]>(["study-messages", conversationId, convType]);

      const optimistic: StudyMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        conversation_type: convType,
        sender_id: user!.id,
        content,
        attachment_url: attachment_url ?? null,
        created_at: new Date().toISOString(),
      };

      qc.setQueryData<StudyMessage[]>(
        ["study-messages", conversationId, convType],
        (old) => (old ? [...old, optimistic] : [optimistic])
      );

      return { prevMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevMessages) {
        qc.setQueryData(["study-messages", conversationId, convType], context.prevMessages);
      }
    },
    onSuccess: (newMsg) => {
      // Replace the optimistic entry with the real server message
      qc.setQueryData<StudyMessage[]>(
        ["study-messages", conversationId, convType],
        (old) => {
          if (!old) return [newMsg];
          const withoutOptimistic = old.filter((m) => !m.id.startsWith("optimistic-"));
          if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic;
          return [...withoutOptimistic, newMsg];
        }
      );
    },
  });
}
