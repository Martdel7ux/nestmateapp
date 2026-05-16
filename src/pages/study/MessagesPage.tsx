import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConversationListItemRow } from "@/components/features/study/ConversationListItem";
import { useConversations } from "@/hooks/use-conversations";
import type { StudyMessageConvType } from "@/types/study";

export function StudyMessagesPage() {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();

  const handleConvoClick = (id: string, type: StudyMessageConvType) => {
    navigate(`/study/messages/${id}?type=${type}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 px-5 pb-4 pt-4 dark:bg-primary/5">
        <h1 className="font-display text-3xl font-bold text-foreground">Study Messages</h1>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {isLoading ? (
          <div className="space-y-px pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-40 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
            <MessageCircle size={40} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">
              Message a peer or join a study group to start chatting
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border pt-2">
            {conversations.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="w-full text-left"
                onClick={() => handleConvoClick(item.id, item.type)}
              >
                <ConversationListItemRow item={item} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
