import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useHousehold, useHouseholdMembers, useHouseholdBalances } from "@/hooks/use-household";
import { formatCurrency, computeSettleSuggestions, getMemberName } from "@/lib/household-utils";

export function SettleUpPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: household } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { data: balances = [] } = useHouseholdBalances(id);

  const memberMap = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const currency = household?.currency ?? "EUR";

  const balanceMap = useMemo(
    () => Object.fromEntries(balances.map((b) => [b.user_id, b.balance])),
    [balances]
  );

  const suggestions = useMemo(
    () => computeSettleSuggestions(balanceMap),
    [balanceMap]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Settle Up" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* All balances */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All Balances</p>
          {members.map((m) => {
            const bal = balanceMap[m.user_id] ?? 0;
            return (
              <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-background/70 dark:bg-slate-800/60 p-3">
                <span className="flex-1 text-sm font-medium text-foreground">{getMemberName(m)}</span>
                <span className={`text-sm font-bold ${bal > 0.005 ? "text-emerald-600" : bal < -0.005 ? "text-rose-500" : "text-muted-foreground"}`}>
                  {bal > 0.005 ? "+" : ""}{formatCurrency(bal, currency)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggested Payments</p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Everyone is settled up 🎉</p>
          ) : (
            suggestions.map((s, i) => {
              const from = memberMap[s.from_user_id];
              const to   = memberMap[s.to_user_id];
              if (!from || !to) return null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    navigate(`/household/${id}/settle/new`, {
                      state: {
                        from_user_id: s.from_user_id,
                        to_user_id: s.to_user_id,
                        amount: s.amount.toFixed(2),
                      },
                    })
                  }
                  className="w-full flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3.5 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-foreground">{getMemberName(from)}</span>
                      <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground">{getMemberName(to)}</span>
                    </div>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(s.amount, currency)}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
