import { useMemo, useState } from "react";
import { Languages, Send, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useData } from "@/contexts/data-context";

export function ChatWindow({ matchId }: { matchId: string }) {
  const { snapshot, sendMessage } = useData();
  const [draft, setDraft] = useState("");
  const [translatedMessageId, setTranslatedMessageId] = useState<string | null>(null);
  const messages = useMemo(
    () => snapshot.messages.filter((message) => message.match_id === matchId),
    [matchId, snapshot.messages]
  );

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Realtime conversation</p>
          <p className="text-sm text-muted-foreground">
            Presence, read receipts, and attachments are wired through Supabase schema.
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <ShieldBan size={16} />
          Block / report
        </Button>
      </div>

      <div className="space-y-3 rounded-[1.75rem] bg-muted/45 p-4">
        {messages.map((message) => {
          const isMine = message.sender_id === snapshot.profile.id;
          return (
            <div key={message.id} className={isMine ? "text-right" : "text-left"}>
              <div
                className={[
                  "inline-block max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                ].join(" ")}
              >
                {translatedMessageId === message.id ? "Translated preview: " : ""}
                {message.content}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                  onClick={() =>
                    setTranslatedMessageId((current) => (current === message.id ? null : message.id))
                  }
                >
                  <Languages size={12} />
                  Translate
                </button>
                <span>{message.read ? "Read" : "Sent"}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Write a message..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          size="icon"
          onClick={() => {
            if (!draft.trim()) return;
            sendMessage(matchId, draft.trim());
            setDraft("");
          }}
        >
          <Send size={16} />
        </Button>
      </div>
    </Card>
  );
}
