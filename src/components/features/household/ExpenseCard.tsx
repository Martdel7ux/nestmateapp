import type { Expense, HouseholdMember } from "@/types/household";
import { formatCurrency, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/household-utils";
import { getMemberName } from "@/lib/household-utils";

interface Props {
  expense: Expense;
  members: HouseholdMember[];
  currentUserId: string;
  currency?: string;
  onClick?: () => void;
}

export function ExpenseCard({ expense, members, currentUserId, currency = "EUR", onClick }: Props) {
  const memberMap = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const payer = memberMap[expense.paid_by];
  const myShare = expense.shares?.find((s) => s.user_id === currentUserId)?.amount ?? 0;
  const iPaid = expense.paid_by === currentUserId;
  const emoji = expense.category ? CATEGORY_EMOJI[expense.category] ?? "💸" : "💸";
  const label = expense.category ? CATEGORY_LABELS[expense.category] : "Other";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-3.5 text-left shadow-sm active:scale-[0.98] transition-transform"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{expense.description}</p>
        <p className="text-xs text-muted-foreground">
          {payer ? getMemberName(payer) : "Unknown"} · {label} · {new Date(expense.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-foreground">{formatCurrency(expense.amount, currency)}</p>
        <p className={`text-xs ${iPaid ? "text-emerald-600" : "text-rose-500"}`}>
          {iPaid ? `+${formatCurrency(expense.amount - myShare, currency)}` : `-${formatCurrency(myShare, currency)}`}
        </p>
      </div>
    </button>
  );
}
