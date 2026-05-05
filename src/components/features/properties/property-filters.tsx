import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cities } from "@/lib/constants";

interface PropertyFiltersProps {
  filters: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    studentType?: string;
    sort?: string;
  };
  onChange: (patch: Record<string, string | number | undefined>) => void;
  onSmartSearch: (query: string) => void;
}

export function PropertyFilters({
  filters,
  onChange,
  onSmartSearch
}: PropertyFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="glass flex items-center gap-3 rounded-[1.75rem] p-3">
        <Search size={18} className="text-primary" />
        <Input
          className="border-none bg-transparent shadow-none ring-0 focus:ring-0"
          placeholder='Try: "cheap studio near university in Nicosia"'
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSmartSearch((event.target as HTMLInputElement).value);
            }
          }}
        />
        <Button onClick={() => onSmartSearch("cheap studio near university in Nicosia")}>
          AI Search
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <Select value={filters.city ?? ""} onChange={(e) => onChange({ city: e.target.value || undefined })}>
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Input
          placeholder="Min €"
          type="number"
          value={filters.minPrice ?? ""}
          onChange={(e) => onChange({ minPrice: Number(e.target.value) || undefined })}
        />
        <Input
          placeholder="Max €"
          type="number"
          value={filters.maxPrice ?? ""}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) || undefined })}
        />
        <Select
          value={filters.studentType ?? ""}
          onChange={(e) => onChange({ studentType: e.target.value || undefined })}
        >
          <option value="">All student types</option>
          <option value="erasmus">Erasmus / short-term</option>
          <option value="full_time">Full-time</option>
        </Select>
        <Select value={filters.sort ?? "date_desc"} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="date_desc">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </Select>
      </div>
    </div>
  );
}
