import { FileText, Image, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/document";
import { CategoryBadge } from "./CategoryBadge";
import { formatFileSize, isPdf } from "@/utils/fileValidation";

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86_400_000);
}

interface Props {
  document: Document;
  onClick: () => void;
}

export function DocumentCard({ document: doc, onClick }: Props) {
  const days     = doc.expires_at ? daysUntil(doc.expires_at) : null;
  const expiring = days !== null && days <= 30;
  const expired  = days !== null && days < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-3.5 text-left active:scale-[0.98] transition-transform"
    >
      {/* Icon */}
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        expired    ? "bg-rose-100 dark:bg-rose-900/30"
        : expiring ? "bg-amber-100 dark:bg-amber-900/30"
                   : "bg-primary/10"
      )}>
        {isPdf(doc.mime_type)
          ? <FileText size={18} className={cn(expired ? "text-rose-500" : expiring ? "text-amber-500" : "text-primary")} />
          : <Image    size={18} className={cn(expired ? "text-rose-500" : expiring ? "text-amber-500" : "text-primary")} />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
          <CategoryBadge category={doc.category} size="sm" />
        </div>

        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
          {doc.visibility === "household" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={10} /> Shared
            </span>
          )}
          {expired && (
            <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold">
              <AlertTriangle size={10} /> Expired
            </span>
          )}
          {!expired && expiring && days !== null && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <AlertTriangle size={10} />
              {days === 0 ? "Expires today" : `${days}d left`}
            </span>
          )}
        </div>

        {doc.tags.length > 0 && (
          <div className="mt-1.5 flex gap-1 flex-wrap">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
