import { useParams, useNavigate } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHousehold, useHouseholdMembers, useExpenses } from "@/hooks/use-household";
import { ExpenseCard } from "@/components/features/household/ExpenseCard";
import { useI18n } from "@/contexts/i18n-context";

export function ExpensesListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: household } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { data: expenses = [], isLoading } = useExpenses(id, 100);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={t("householdExpensesTitle")}
        right={{
          type: "custom",
          element: (
            <button
              type="button"
              onClick={() => navigate(`/household/${id}/expenses/new`)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Plus size={16} />
            </button>
          ),
        }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        )}
        {!isLoading && expenses.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("householdNoExpList")}</p>
          </div>
        )}
        {expenses.map((exp) => (
          <ExpenseCard
            key={exp.id}
            expense={exp}
            members={members}
            currentUserId={user?.id ?? ""}
            currency={household?.currency}
            onClick={() => navigate(`/household/${id}/expenses/${exp.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
