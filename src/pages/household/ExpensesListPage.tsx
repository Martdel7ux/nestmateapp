import { useParams, useNavigate } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHousehold, useHouseholdMembers, useExpenses } from "@/hooks/use-household";
import { ExpenseCard } from "@/components/features/household/ExpenseCard";

export function ExpensesListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: household } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { data: expenses = [], isLoading } = useExpenses(id, 100);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title="Expenses"
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
          <div className="flex justify-center py-8">
            <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        {!isLoading && expenses.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Receipt size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No expenses yet.</p>
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
