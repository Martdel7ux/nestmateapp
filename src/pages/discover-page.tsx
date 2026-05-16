import { useCallback, useRef, useState } from "react";
import { Bookmark, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { OpportunityCard } from "@/components/features/discover/opportunity-card";
import { OpportunityFiltersBar } from "@/components/features/discover/opportunity-filters";
import { NotificationBell } from "@/components/features/discover/notification-bell";
import { useOpportunities } from "@/hooks/use-opportunities";
import type { OpportunityFilters } from "@/types/discover";

export function DiscoverPage() {
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useOpportunities(filters);

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

  const opportunities = data?.pages.flat() ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 px-5 pb-4 pt-4 dark:bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Discover</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              to="/discover/saved"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bookmark size={18} />
            </Link>
            <Link
              to="/discover/preferences"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-primary/10 pb-3 dark:bg-primary/5">
        <OpportunityFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))
          ) : opportunities.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <p className="font-semibold text-foreground">No opportunities found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
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
