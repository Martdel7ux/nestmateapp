import { useCallback, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { NoteCard } from "@/components/features/study/NoteCard";
import { NoteFiltersBar } from "@/components/features/study/NoteFilters";
import { usePublicLibrary } from "@/hooks/use-public-library";
import type { NoteFilters } from "@/types/study";

export function PublicLibraryPage() {
  const [filters, setFilters] = useState<NoteFilters>({ sort: "newest" });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePublicLibrary(filters);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          void fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const notes = data?.pages.flat() ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 pt-4 pb-3 bg-background">
        <NoteFiltersBar filters={filters} onChange={setFilters} showSort />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-32 pt-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <BookOpen size={40} className="text-muted-foreground/40" />
              <p className="font-semibold text-foreground">No public notes found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => {}}
              />
            ))
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="h-12 rounded-2xl bg-muted animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
