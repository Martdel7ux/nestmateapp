import { useNavigate } from "react-router-dom";
import { Plus, LogIn, ChevronRight, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHouseholds } from "@/hooks/use-household";
import { useI18n } from "@/contexts/i18n-context";

export function HouseholdIndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: households = [], isLoading } = useHouseholds(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader title={t("householdTitle")} />
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (households.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader title={t("householdTitle")} />
        <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Home size={36} className="text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{t("householdSubtitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t("householdDesc")}
            </p>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <button
              type="button"
              onClick={() => navigate("/household/new")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm active:scale-[0.97] transition-transform"
            >
              <Plus size={18} />
              {t("householdCreate")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/household/join")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 font-semibold text-foreground active:scale-[0.97] transition-transform"
            >
              <LogIn size={18} />
              {t("householdJoinCode")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        title={t("householdTitle")}
        right={{
          type: "custom",
          element: (
            <button
              type="button"
              onClick={() => navigate("/household/new")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Plus size={16} />
            </button>
          ),
        }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {households.map((hh) => (
          <button
            key={hh.id}
            type="button"
            onClick={() => navigate(`/household/${hh.id}`)}
            className="w-full flex items-center gap-4 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl">
              🏠
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{hh.name}</p>
              {hh.address && <p className="text-xs text-muted-foreground truncate">{hh.address}</p>}
            </div>
            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
          </button>
        ))}

        <button
          type="button"
          onClick={() => navigate("/household/join")}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
        >
          <LogIn size={16} />
          {t("householdJoinAnother")}
        </button>
      </div>
    </div>
  );
}
