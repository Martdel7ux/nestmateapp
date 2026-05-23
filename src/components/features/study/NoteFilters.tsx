import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseSelect } from "./CourseSelect";
import type { NoteFilters, NoteVisibility } from "@/types/study";

const VISIBILITY_TABS: { value: NoteVisibility | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "private", label: "Private" },
  { value: "group", label: "Group" },
  { value: "public", label: "Public" },
];

const SORT_OPTIONS: { value: NoteFilters["sort"]; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "upvotes", label: "Most Upvoted" },
  { value: "views", label: "Most Viewed" },
];

interface Props {
  filters: NoteFilters;
  onChange: (f: NoteFilters) => void;
  showVisibility?: boolean;
  showSort?: boolean;
}

export function NoteFiltersBar({
  filters,
  onChange,
  showVisibility = true,
  showSort = false,
}: Props) {
  return (
    <div className="space-y-2 px-4">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
        <Search size={15} className="shrink-0 text-muted-foreground" />
        <input
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search notes…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {filters.query && (
          <button type="button" onClick={() => onChange({ ...filters, query: "" })}>
            <X size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Course select */}
      <CourseSelect
        value={filters.course_id ?? null}
        onChange={(id) => onChange({ ...filters, course_id: id })}
        placeholder="All courses"
      />

      {/* Visibility tabs */}
      {showVisibility && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {VISIBILITY_TABS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ ...filters, visibility: value })}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                filters.visibility === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-[var(--glass-border)] bg-[var(--glass-fill)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] text-muted-foreground hover:border-primary/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Sort */}
      {showSort && (
        <select
          value={filters.sort ?? "newest"}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as NoteFilters["sort"] })
          }
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
