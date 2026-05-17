import { useMemo } from "react";
import type { HouseholdBalance, HouseholdMember } from "@/types/household";
import { formatCurrency, computeSettleSuggestions } from "@/lib/household-utils";
import { getMemberName } from "@/lib/household-utils";
import { cn } from "@/lib/utils";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  balances: HouseholdBalance[];
  members: HouseholdMember[];
  currentUserId: string;
  currency?: string;
}

export function BalanceSummary({ balances, members, currentUserId, currency = "EUR" }: Props) {
  const memberMap = useMemo(() =>
    Object.fromEntries(members.map((m) => [m.user_id, m])),
    [members]
  );

  const myBalance = balances.find((b) => b.user_id === currentUserId)?.balance ?? 0;

  const balanceMap = useMemo(() =>
    Object.fromEntries(balances.map((b) => [b.user_id, b.balance])),
    [balances]
  );

  const suggestions = useMemo(
    () => computeSettleSuggestions(balanceMap).filter(
      (s) => s.from_user_id === currentUserId || s.to_user_id === currentUserId
    ),
    [balanceMap, currentUserId]
  );

  return (
    <div className="space-y-3">
      {/* My net balance */}
      <div className={cn(
        "rounded-2xl p-4 flex items-center gap-3",
        myBalance > 0.005
          ? "bg-emerald-50 dark:bg-emerald-900/20"
          : myBalance < -0.005
            ? "bg-rose-50 dark:bg-rose-900/20"
            : "bg-muted/50"
      )}>
        {myBalance > 0.005 ? (
          <TrendingUp size={20} className="text-emerald-600 shrink-0" />
        ) : myBalance < -0.005 ? (
          <TrendingDown size={20} className="text-rose-500 shrink-0" />
        ) : (
          <Minus size={20} className="text-muted-foreground shrink-0" />
        )}
        <div>
          <p className="text-xs text-muted-foreground">Your balance</p>
          <p className={cn("text-xl font-bold",
            myBalance > 0.005 ? "text-emerald-600" : myBalance < -0.005 ? "text-rose-500" : "text-foreground"
          )}>
            {myBalance > 0.005 ? "+" : ""}{formatCurrency(myBalance, currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {myBalance > 0.005 ? "you are owed" : myBalance < -0.005 ? "you owe" : "all settled up"}
          </p>
        </div>
      </div>

      {/* Suggested settlements involving me */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Suggested</p>
          {suggestions.map((s, i) => {
            const from = memberMap[s.from_user_id];
            const to   = memberMap[s.to_user_id];
            if (!from || !to) return null;
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-background/70 dark:bg-slate-800/60 p-3 text-sm">
                <span className="font-medium text-foreground">{getMemberName(from)}</span>
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">{getMemberName(to)}</span>
                <span className="ml-auto font-semibold text-foreground">{formatCurrency(s.amount, currency)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
