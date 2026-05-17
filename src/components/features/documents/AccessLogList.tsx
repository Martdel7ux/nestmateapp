import { Eye, Download, Share2, Trash2, RotateCcw } from "lucide-react";
import type { DocumentAccessLog, DocumentAccessAction } from "@/types/document";

const ACTION_ICONS: Record<DocumentAccessAction, React.ElementType> = {
  view:     Eye,
  download: Download,
  share:    Share2,
  delete:   Trash2,
  restore:  RotateCcw,
};

const ACTION_LABELS: Record<DocumentAccessAction, string> = {
  view:     "Viewed",
  download: "Downloaded",
  share:    "Shared",
  delete:   "Deleted",
  restore:  "Restored",
};

interface Props {
  logs: DocumentAccessLog[];
}

export function AccessLogList({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No access history.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const Icon  = ACTION_ICONS[log.action];
        const label = ACTION_LABELS[log.action];
        const date  = new Date(log.accessed_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        });

        return (
          <div key={log.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon size={13} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
