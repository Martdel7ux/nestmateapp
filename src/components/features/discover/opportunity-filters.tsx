import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityFilters, OpportunityType, OppLocationType } from "@/types/discover";

const TYPES: { value: OpportunityType; label: string }[] = [
  { value: "event", label: "Events" },
  { value: "job", label: "Jobs" },
  { value: "internship", label: "Internships" },
  { value: "volunteering", label: "Volunteering" },
];

const LOCATION_TYPES: { value: OppLocationType; label: string }[] = [
  { value: "in_person", label: "In-person" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

interface Props {
  filters: OpportunityFilters;
  onChange: (f: OpportunityFilters) => void;
}

export function OpportunityFiltersBar({ filters, onChange }: Props) {
  const setType = (t: OpportunityType | null) =>
    onChange({ ...filters, type: filters.type === t ? null : t });
  const setLocationType = (l: OppLocationType | null) =>
    onChange({ ...filters, location_type: filters.location_type === l ? null : l });

  return (
    <div className="space-y-2 px-4">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search opportunities…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {filters.query && (
          <button type="button" onClick={() => onChange({ ...filters, query: "" })}>
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Type pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filters.type === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Location type pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {LOCATION_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setLocationType(value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filters.location_type === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
