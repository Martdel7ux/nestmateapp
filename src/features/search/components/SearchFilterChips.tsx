const FILTERS = [
  { id: "all",        label: "All" },
  { id: "features",  label: "Features" },
  { id: "events",    label: "Events" },
  { id: "notes",     label: "Notes" },
  { id: "properties",label: "Properties" },
  { id: "documents", label: "Documents" },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export function SearchFilterChips({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 py-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
            active === f.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
