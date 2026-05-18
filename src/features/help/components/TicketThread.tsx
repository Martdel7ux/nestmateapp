import { cn } from "@/lib/utils";
import type { SupportReply } from "@/types/help";

interface Props {
  replies: SupportReply[];
  currentUserId: string;
}

export function TicketThread({ replies, currentUserId }: Props) {
  if (!replies.length) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No replies yet — we'll get back to you shortly.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => {
        const isMine = reply.sender_id === currentUserId;
        return (
          <div key={reply.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm border border-border",
              )}
            >
              {!isMine && (
                <p className="mb-1 text-[11px] font-semibold opacity-60">Nestmate Support</p>
              )}
              <p className="whitespace-pre-wrap">{reply.body}</p>
              <p className={cn("mt-1.5 text-[10px] opacity-50 text-right")}>
                {new Date(reply.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
