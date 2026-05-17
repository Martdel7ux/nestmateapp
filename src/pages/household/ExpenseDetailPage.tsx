import { useParams, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import {
  useExpense, useHouseholdMembers, useDeleteExpense, useHousehold,
} from "@/hooks/use-household";
import { formatCurrency, CATEGORY_EMOJI, CATEGORY_LABELS, getMemberName } from "@/lib/household-utils";

export function ExpenseDetailPage() {
  const { id, expenseId } = useParams<{ id: string; expenseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: expense, isLoading } = useExpense(expenseId);
  const { data: members = [] } = useHouseholdMembers(id);
  const { data: household } = useHousehold(id);
  const { mutateAsync: deleteExpense, isPending: deleting } = useDeleteExpense(id!);

  const memberMap = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const currency = household?.currency ?? "EUR";

  async function handleDelete() {
    if (!expenseId) return;
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    try {
      await deleteExpense(expenseId);
      toast.success("Expense deleted.");
      navigate(-1);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Expense" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Not Found" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Expense not found.</div>
      </div>
    );
  }

  const payer = memberMap[expense.paid_by];
  const canDelete = user?.id === expense.created_by;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={expense.description}
        right={canDelete ? {
          type: "custom",
          element: (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          ),
        } : { type: "none" }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Amount */}
        <div className="rounded-2xl bg-primary/10 dark:bg-primary/5 p-5 text-center">
          <p className="text-4xl font-bold text-foreground">{formatCurrency(expense.amount, currency)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {expense.category ? `${CATEGORY_EMOJI[expense.category]} ${CATEGORY_LABELS[expense.category]}` : "Other"}
          </p>
        </div>

        {/* Meta */}
        <div className="space-y-3 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-4">
          {[
            { label: "Paid by",    value: payer ? getMemberName(payer) : "—" },
            { label: "Date",       value: new Date(expense.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
            { label: "Split",      value: expense.split_method },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold text-foreground capitalize">{value}</span>
            </div>
          ))}
          {expense.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground mt-0.5">{expense.notes}</p>
            </div>
          )}
        </div>

        {/* Shares */}
        {expense.shares && expense.shares.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Split breakdown</p>
            {expense.shares.map((s) => {
              const m = memberMap[s.user_id];
              return (
                <div key={s.user_id} className="flex items-center gap-3 rounded-xl bg-background/70 dark:bg-slate-800/60 p-3">
                  <span className="flex-1 text-sm text-foreground">{m ? getMemberName(m) : "—"}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(s.amount, currency)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
