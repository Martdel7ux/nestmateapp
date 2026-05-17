import type { HouseholdMember, SplitMethod } from "@/types/household";
import { getMemberName } from "@/lib/household-utils";
import { cn } from "@/lib/utils";

interface Props {
  method: SplitMethod;
  members: HouseholdMember[];
  participantIds: string[];
  onToggleParticipant: (uid: string) => void;
  customShares: Record<string, string>;
  onCustomShare: (uid: string, val: string) => void;
  shareWeights: Record<string, string>;
  onShareWeight: (uid: string, val: string) => void;
  total: string;
  currency?: string;
}

export function SplitInputs({
  method, members, participantIds, onToggleParticipant,
  customShares, onCustomShare, shareWeights, onShareWeight,
  total, currency = "EUR",
}: Props) {
  return (
    <div className="space-y-2">
      {members.map((m) => {
        const active = participantIds.includes(m.user_id);
        return (
          <div key={m.user_id} className={cn(
            "flex items-center gap-3 rounded-xl p-3 transition-colors",
            active ? "bg-primary/5" : "bg-muted/30 opacity-50"
          )}>
            <button
              type="button"
              onClick={() => onToggleParticipant(m.user_id)}
              className={cn(
                "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                active ? "bg-primary border-primary" : "border-border"
              )}
            >
              {active && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
            </button>
            <span className="flex-1 text-sm font-medium text-foreground">{getMemberName(m)}</span>

            {active && method === "custom" && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{currency === "EUR" ? "€" : currency}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customShares[m.user_id] ?? ""}
                  onChange={(e) => onCustomShare(m.user_id, e.target.value)}
                  className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="0.00"
                />
              </div>
            )}

            {active && method === "shares" && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={shareWeights[m.user_id] ?? "1"}
                  onChange={(e) => onShareWeight(m.user_id, e.target.value)}
                  className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-xs text-muted-foreground">parts</span>
              </div>
            )}

            {active && method === "equal" && (
              <span className="text-sm text-muted-foreground">
                {participantIds.length > 0
                  ? `≈ ${(parseFloat(total || "0") / participantIds.length).toFixed(2)}`
                  : "—"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
