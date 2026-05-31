import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, ArrowLeftRight, Users, Settings, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import {
  useHousehold, useHouseholdMembers, useHouseholdBalances, useExpenses,
} from "@/hooks/use-household";
import { BalanceSummary } from "@/components/features/household/BalanceSummary";
import { ExpenseCard } from "@/components/features/household/ExpenseCard";
import { useI18n } from "@/contexts/i18n-context";

export function HouseholdDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: household, isLoading: hhLoading } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { data: balances = [] } = useHouseholdBalances(id);
  const { data: expenses = [] } = useExpenses(id, 10);

  if (hhLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title={t("householdTitle")} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title={t("householdNotFound")} />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">{t("householdNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={household.name}
        subtitle={household.address ?? undefined}
        right={{
          type: "custom",
          element: (
            <Link to={`/household/${id}/settings`} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition hover:bg-muted/80">
              <Settings size={16} />
            </Link>
          ),
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Plus, label: t("householdAddExpense"), to: `/household/${id}/expenses/new` },
            { icon: ArrowLeftRight, label: t("householdSettleUp"), to: `/household/${id}/settle` },
            { icon: Users, label: t("householdMembers"), to: `/household/${id}/members` },
          ].map(({ icon: Icon, label, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-3 shadow-sm text-center active:scale-95 transition-transform"
            >
              <Icon size={20} className="text-primary" />
              <span className="text-[11px] font-semibold text-foreground leading-tight">{label}</span>
            </Link>
          ))}
        </div>

        {/* Balance summary */}
        {user && (
          <BalanceSummary
            balances={balances}
            members={members}
            currentUserId={user.id}
            currency={household.currency}
          />
        )}

        {/* Recent expenses */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("householdRecentExp")}</p>
            <Link to={`/household/${id}/expenses`} className="text-xs text-primary font-semibold">{t("householdSeeAll")}</Link>
          </div>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Receipt size={32} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t("householdNoExpenses")}</p>
            </div>
          ) : (
            expenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                members={members}
                currentUserId={user?.id ?? ""}
                currency={household.currency}
                onClick={() => navigate(`/household/${id}/expenses/${exp.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <div className="absolute bottom-24 right-4 z-20">
        <Link
          to={`/household/${id}/expenses/new`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </Link>
      </div>
    </div>
  );
}
