import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { UnreadBadge } from "./UnreadBadge";
import type { ConversationListItem as ConvItem } from "@/types/study";

function formatTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;

  if (diffH < 24) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Props {
  item: ConvItem;
  isActive?: boolean;
}

export function ConversationListItemRow({ item, isActive }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      {/* Avatar or group icon */}
      {item.type === "direct" ? (
        <Avatar
          name={item.name}
          src={item.avatar_url}
          className="h-11 w-11 shrink-0"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Users size={20} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatTime(item.last_message_at)}
          </span>
        </div>
        {item.last_message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.last_message}
          </p>
        )}
      </div>

      {/* Unread badge */}
      <UnreadBadge count={item.unread_count} />
    </div>
  );
}
