import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/page-header";
import { ChatWindow } from "@/components/features/chat/chat-window";

export function ChatPage() {
  const { matchId = "" } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chat"
        title="Private conversation"
        description="Messages are restricted to match participants via security-definer helper functions."
      />
      <ChatWindow matchId={matchId} />
    </div>
  );
}
