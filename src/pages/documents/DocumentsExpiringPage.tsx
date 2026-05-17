import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useExpiringDocuments } from "@/hooks/use-documents";
import { DocumentCard } from "@/components/features/documents/DocumentCard";

export function DocumentsExpiringPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: docs = [], isLoading } = useExpiringDocuments(user?.id, 60);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Expiring Documents" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && docs.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <CheckCircle size={36} className="text-green-500/60" />
            <p className="text-sm font-semibold text-foreground">All good!</p>
            <p className="text-xs text-muted-foreground">No documents expiring in the next 60 days.</p>
          </div>
        )}

        {!isLoading && docs.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mb-2">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-semibold">{docs.length} document{docs.length !== 1 ? "s" : ""}</span> expiring within 60 days
            </p>
          </div>
        )}

        {docs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={() => navigate(`/documents/${doc.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
