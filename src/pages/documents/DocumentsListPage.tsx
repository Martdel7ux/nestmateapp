import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Trash2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentCard } from "@/components/features/documents/DocumentCard";
import { DocumentFilters } from "@/components/features/documents/DocumentFilters";
import type { DocumentFilters as Filters } from "@/types/document";

export function DocumentsListPage() {
  const navigate          = useNavigate();
  const { user }          = useAuth();
  const { data: docs = [], isLoading } = useDocuments(user?.id);
  const [filters, setFilters] = useState<Filters>({});

  const filtered = useMemo(() => {
    let list = docs;
    if (filters.category) list = list.filter((d) => d.category === filters.category);
    return list;
  }, [docs, filters]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title="Documents"
        right={{
          type: "custom",
          element: (
            <button type="button" onClick={() => navigate("/documents/new")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus size={16} />
            </button>
          ),
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Quick-links */}
        <div className="flex gap-2 px-4 pt-4 pb-2">
          <button type="button" onClick={() => navigate("/documents/expiring")}
            className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-[var(--glass-fill)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:brightness-110 transition-all">
            <Clock size={11} /> Expiring
          </button>
          <button type="button" onClick={() => navigate("/documents/trash")}
            className="flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:brightness-110 transition-all">
            <Trash2 size={11} /> Trash
          </button>
        </div>

        {/* Category filters */}
        <div className="px-4 pb-3">
          <DocumentFilters filters={filters} onChange={setFilters} />
        </div>

        {/* List */}
        <div className="px-4 pb-28 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-2xl" />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FolderOpen size={36} className="text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                {docs.length === 0 ? "No documents yet" : "No documents match the filter"}
              </p>
              {docs.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tap the + button to upload your first document.
                </p>
              )}
            </div>
          )}

          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={() => navigate(`/documents/${doc.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
