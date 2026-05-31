import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { OpportunityCard } from "@/components/features/discover/opportunity-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedOpportunities } from "@/hooks/use-saved-opportunities";
import { useI18n } from "@/contexts/i18n-context";

export function SavedOpportunitiesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data, isLoading } = useSavedOpportunities();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("savedOppsTitle")} right={{ type: "none" }} />

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
              <p className="font-semibold">{t("savedOppsEmpty")}</p>
              <p className="text-sm text-muted-foreground">
                {t("savedOppsInstruction")}
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
