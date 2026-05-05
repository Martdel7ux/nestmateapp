import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FlatmateForm } from "@/components/features/flatmates/flatmate-form";
import { SwipeDeck } from "@/components/features/flatmates/swipe-deck";
import { useData } from "@/contexts/data-context";
import { cities } from "@/lib/constants";

export function FlatmatesPage() {
  const { flatmateFilters, setFlatmateFilters } = useData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flatmates"
        title="Swipe for compatible roommates"
        description="Students must create a listing before browsing. The matching gate prioritizes flat-holders paired with seekers."
      />

      <Card className="grid gap-3 md:grid-cols-4">
        <Select
          value={flatmateFilters.city ?? ""}
          onChange={(event) =>
            setFlatmateFilters({ ...flatmateFilters, city: event.target.value || undefined })
          }
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          placeholder="Min budget"
          value={flatmateFilters.minBudget ?? ""}
          onChange={(event) =>
            setFlatmateFilters({
              ...flatmateFilters,
              minBudget: Number(event.target.value) || undefined
            })
          }
        />
        <Input
          type="number"
          placeholder="Max budget"
          value={flatmateFilters.maxBudget ?? ""}
          onChange={(event) =>
            setFlatmateFilters({
              ...flatmateFilters,
              maxBudget: Number(event.target.value) || undefined
            })
          }
        />
        <Select
          value={flatmateFilters.studentType ?? ""}
          onChange={(event) =>
            setFlatmateFilters({
              ...flatmateFilters,
              studentType: event.target.value || undefined
            })
          }
        >
          <option value="">All student types</option>
          <option value="erasmus">Erasmus / short-term</option>
          <option value="full_time">Full-time</option>
        </Select>
      </Card>

      <FlatmateForm />

      <div className="mx-auto max-w-xl">
        <SwipeDeck />
      </div>
    </div>
  );
}
