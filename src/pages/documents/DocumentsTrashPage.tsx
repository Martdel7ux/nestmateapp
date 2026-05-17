import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useTrashedDocuments, useRestoreDocument, useHardDeleteDocument } from "@/hooks/use-documents";
import { CategoryBadge } from "@/components/features/documents/CategoryBadge";
import { formatFileSize } from "@/utils/fileValidation";
import type { Document } from "@/types/document";

export function DocumentsTrashPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: docs = [], isLoading } = useTrashedDocuments(user?.id);
  const { mutateAsync: restore }    = useRestoreDocument(user?.id ?? "");
  const { mutateAsync: hardDelete } = useHardDeleteDocument(user?.id ?? "");

  async function handleRestore(id: string) {
    try {
      await restore(id);
      toast.success("Document restored.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleHardDelete(doc: Document) {
    if (!confirm("Permanently delete this document? This cannot be undone.")) return;
    try {
      await hardDelete(doc);
      toast.success("Document permanently deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Trash" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && docs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trash2 size={36} className="text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Trash is empty</p>
          </div>
        )}

        {!isLoading && docs.length > 0 && (
          <p className="text-xs text-muted-foreground px-1">
            Documents in trash can be restored for 30 days after deletion.
          </p>
        )}

        {docs.map((doc) => {
          const deletedDaysAgo = Math.floor(
            (Date.now() - new Date(doc.deleted_at!).getTime()) / 86_400_000
          );
          return (
            <div key={doc.id}
              className="rounded-2xl border border-border bg-background/60 p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CategoryBadge category={doc.category} size="sm" />
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</span>
                    <span className="text-xs text-muted-foreground">
                      Deleted {deletedDaysAgo === 0 ? "today" : `${deletedDaysAgo}d ago`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleRestore(doc.id)}
                  className="flex-1 rounded-xl border border-primary/30 bg-primary/5 py-2 text-sm font-semibold text-primary">
                  Restore
                </button>
                <button type="button" onClick={() => handleHardDelete(doc)}
                  className="flex-1 rounded-xl border border-destructive/30 bg-destructive/5 py-2 text-sm font-semibold text-destructive">
                  Delete forever
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
