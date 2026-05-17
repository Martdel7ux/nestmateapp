import { cn } from "@/lib/utils";
import type { DocumentCategory, DocumentFilters as Filters } from "@/types/document";
import { CATEGORY_LABELS } from "@/types/document";

const CATEGORIES: DocumentCategory[] = [
  "lease", "deposit_receipt", "utility_bill", "rent_receipt", "insurance",
  "university_id", "residence_permit", "visa", "passport",
  "bank_statement", "medical", "tax", "other",
];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function DocumentFilters({ filters, onChange }: Props) {
  function setCategory(cat: DocumentCategory | undefined) {
    onChange({ ...filters, category: cat });
  }

  return (
    <div className="-mx-5">
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategory(undefined)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all",
            !filters.category
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(filters.category === cat ? undefined : cat)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all whitespace-nowrap",
              filters.category === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground"
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
}
