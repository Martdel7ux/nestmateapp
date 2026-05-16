import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { StudyMessage } from "@/types/study";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  message: StudyMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const isDeleted = !!message.deleted_at;
  const senderName = message.sender?.full_name ?? "Unknown";

  return (
    <div
      className={cn(
        "flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Other user avatar */}
      {!isOwn && (
        <Avatar
          name={senderName}
          src={message.sender?.avatar_url}
          className="h-7 w-7 shrink-0 self-end"
        />
      )}

      <div className={cn("flex flex-col max-w-[72%]", isOwn ? "items-end" : "items-start")}>
        {/* Sender name (for group chats, non-own messages) */}
        {!isOwn && (
          <span className="mb-0.5 text-[10px] font-medium text-muted-foreground px-1">
            {senderName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-card text-card-foreground",
            isDeleted && "opacity-60"
          )}
        >
          {isDeleted ? (
            <span className="italic text-muted-foreground">This message was deleted</span>
          ) : (
            <>
              {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
              {message.attachment_url && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "mt-1 block text-xs underline",
                    isOwn ? "text-primary-foreground/80" : "text-primary"
                  )}
                >
                  Attachment
                </a>
              )}
            </>
          )}
        </div>

        {/* Time */}
        <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
          {message.edited_at && !isDeleted && " · edited"}
        </span>
      </div>
    </div>
  );
}
