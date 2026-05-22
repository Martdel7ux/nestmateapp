import { useCallback, useRef, useState } from "react";
import { Bookmark, Lightbulb, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import { OpportunityCard } from "@/components/features/discover/opportunity-card";
import { OpportunityFiltersBar } from "@/components/features/discover/opportunity-filters";
import { NotificationBell } from "@/components/features/discover/notification-bell";
import { SuggestEventModal } from "@/components/features/discover/SuggestEventModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useScrolled } from "@/hooks/use-scrolled";
import type { OpportunityFilters } from "@/types/discover";

export function DiscoverPage() {
  const [filters, setFilters]   = useState<OpportunityFilters>({});
  const [showSuggest, setShowSuggest] = useState(false);
  const isCollapsed = useScrolled(50);
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
      {showSuggest && <SuggestEventModal onClose={() => setShowSuggest(false)} />}
      <AppHeader
        title="Discover"
        universalSearch={false}
        right={{
          type: "custom",
          element: (
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <NotificationBell />
                  <Link
                    to="/discover/saved"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm text-foreground hover:brightness-110 transition-colors"
                    aria-label="Saved opportunities"
                  >
                    <Bookmark size={18} />
                  </Link>
                  <Link
                    to="/discover/preferences"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm text-foreground hover:brightness-110 transition-colors"
                    aria-label="Discover preferences"
                  >
                    <Settings size={18} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          ),
        }}
      />

      {/* Filters */}
      <div className="shrink-0 bg-primary/10 pb-3 dark:bg-primary/5">
        <OpportunityFiltersBar filters={filters} onChange={setFilters} />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
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
            <Skeleton className="h-12 rounded-2xl" />
          )}

          {/* Suggest CTA — shown at bottom of results */}
          {!isLoading && (
            <button
              onClick={() => setShowSuggest(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Lightbulb size={15} />
              Know an event we're missing? Suggest it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
