import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/types/help";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10  text-blue-600",
  resolved:    "bg-emerald-500/10 text-emerald-600",
  closed:      "bg-muted text-muted-foreground",
  spam:        "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
  closed: "Closed", spam: "Spam",
};

interface Props {
  ticket: SupportMessage;
}

export function TicketRow({ ticket }: Props) {
  return (
    <Link
      to={`/profile/help/my-tickets/${ticket.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:bg-muted/40 active:scale-[0.98]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_STYLES[ticket.status])}>
            {STATUS_LABEL[ticket.status]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(ticket.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="truncate text-sm font-semibold text-foreground">
          {ticket.subject || "Support request"}
        </p>
        <p className="truncate text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.body}</p>
      </div>
      <ChevronRight size={15} className="shrink-0 text-muted-foreground/40" />
    </Link>
  );
}
