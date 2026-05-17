import { cn } from "@/lib/utils";
import type { DocumentVisibility } from "@/types/document";
import type { Household } from "@/types/household";

interface Props {
  visibility: DocumentVisibility;
  sharedHouseholdId: string;
  households: Household[];
  onVisibilityChange: (v: DocumentVisibility) => void;
  onHouseholdChange: (id: string) => void;
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

export function SharingToggle({
  visibility, sharedHouseholdId, households,
  onVisibilityChange, onHouseholdChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["private", "household"] as DocumentVisibility[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onVisibilityChange(v)}
            className={cn(
              "flex-1 rounded-2xl py-2.5 text-sm font-semibold border transition-all",
              visibility === v
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground"
            )}
          >
            {v === "private" ? "Private" : "Share with household"}
          </button>
        ))}
      </div>

      {visibility === "household" && households.length > 0 && (
        <select
          value={sharedHouseholdId}
          onChange={(e) => onHouseholdChange(e.target.value)}
          className={inputCls}
        >
          <option value="">— Select household —</option>
          {households.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      )}

      {visibility === "household" && households.length === 0 && (
        <p className="text-xs text-muted-foreground">
          You're not in a household yet. Create or join one first.
        </p>
      )}
    </div>
  );
}
