import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { MessageBubble } from "@/components/features/study/MessageBubble";
import { MessageInput } from "@/components/features/study/MessageInput";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { markConversationRead } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";
import type { StudyMessageConvType } from "@/types/study";

export function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const convType = (searchParams.get("type") ?? "direct") as StudyMessageConvType;

  const { data: messages = [], isLoading } = useMessages(conversationId ?? "", convType);
  const { mutate: sendMsg, isPending: sending } = useSendMessage(
    conversationId ?? "",
    convType
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    if (user && conversationId) {
      void markConversationRead(user.id, conversationId);
    }
  }, [user, conversationId]);

  const handleSend = (content: string, attachmentUrl?: string) => {
    sendMsg(
      { content, attachment_url: attachmentUrl },
      {
        onError: () => toast.error("Failed to send message"),
      }
    );
  };

  const title = convType === "group" ? "Group Chat" : "Direct Message";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-semibold text-foreground">{title}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
