import { ArrowLeft, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OpportunityCard } from "@/components/features/discover/opportunity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedOpportunities } from "@/hooks/use-saved-opportunities";

export function SavedOpportunitiesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useSavedOpportunities();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 px-5 pb-5 pt-4 dark:bg-primary/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-bold">Saved</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))
          ) : !data?.length ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bookmark size={28} className="text-muted-foreground" />
              </div>
              <p className="font-semibold">No saved opportunities</p>
              <p className="text-sm text-muted-foreground">
                Tap the bookmark icon on any opportunity to save it here.
              </p>
            </div>
          ) : (
            data.map((opp) => <OpportunityCard key={opp.id} opportunity={opp} />)
          )}
        </div>
      </div>
    </div>
  );
}
