import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/household-utils";
import type { ExpenseCategory } from "@/types/household";
import { cn } from "@/lib/utils";

interface Props {
  value: ExpenseCategory | undefined;
  onChange: (v: ExpenseCategory | undefined) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

export function CategoryPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(value === cat ? undefined : cat)}
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
            value === cat
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/50"
          )}
        >
          <span>{CATEGORY_EMOJI[cat]}</span>
          <span>{CATEGORY_LABELS[cat]}</span>
        </button>
      ))}
    </div>
  );
}
