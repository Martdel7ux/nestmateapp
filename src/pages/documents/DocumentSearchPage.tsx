import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useDocumentSearch } from "@/hooks/use-documents";
import { DocumentCard } from "@/components/features/documents/DocumentCard";

export function DocumentSearchPage() {
  const navigate = useNavigate();
  const [query,  setQuery]  = useState("");

  const { data: results = [], isFetching } = useDocumentSearch(query);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Search Documents" right={{ type: "none" }} />

      <div className="flex-1 overflow-y-auto">
        {/* Search bar */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-2.5">
            <Search size={15} className="shrink-0 text-muted-foreground" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, description, or content…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pt-3 pb-28 space-y-2">
          {isFetching && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!isFetching && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No documents found for "{query}"</p>
            </div>
          )}

          {!isFetching && query.trim().length < 2 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
            </div>
          )}

          {!isFetching && results.map((doc) => (
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
