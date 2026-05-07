import { useState } from "react";
import { Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FlatmateForm } from "@/components/features/flatmates/flatmate-form";
import { SwipeDeck } from "@/components/features/flatmates/swipe-deck";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { cities } from "@/lib/constants";

export function FlatmatesPage() {
  const { snapshot, flatmateFilters, setFlatmateFilters } = useData();
  const { t } = useI18n();
  const [showFilters, setShowFilters] = useState(false);

  const myListing = snapshot.flatmates.find((f) => f.user_id === snapshot.profile.id);

  // ── No listing yet: show only the creation form ──
  if (!myListing) {
    return (
      <div className="space-y-6 px-5 pt-2">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("flatmatesTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("flatmatesSubtitle")}
          </p>
        </div>
        <FlatmateForm />
      </div>
    );
  }

  // ── Listing exists: show browse view ──
  return (
    <div className="space-y-5 px-5 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("flatmatesTitle")}</h1>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            showFilters
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          <Filter size={13} />
          {t("flatmatesFilter")}
        </button>
      </div>

      {/* Collapsible filter panel */}
      {showFilters && (
        <Card className="grid grid-cols-2 gap-3">
          <Select
            value={flatmateFilters.city ?? ""}
            onChange={(e) => setFlatmateFilters({ ...flatmateFilters, city: e.target.value || undefined })}
          >
            <option value="">{t("flatmatesAllCities")}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select
            value={flatmateFilters.studentType ?? ""}
            onChange={(e) => setFlatmateFilters({ ...flatmateFilters, studentType: e.target.value || undefined })}
          >
            <option value="">{t("flatmatesAllTypes")}</option>
            <option value="erasmus">{t("flatmatesErasmus")}</option>
            <option value="full_time">{t("flatmatesFullTime")}</option>
          </Select>
          <Input
            type="number"
            placeholder={t("flatmatesMinBudget")}
            value={flatmateFilters.minBudget ?? ""}
            onChange={(e) => setFlatmateFilters({ ...flatmateFilters, minBudget: Number(e.target.value) || undefined })}
          />
          <Input
            type="number"
            placeholder={t("flatmatesMaxBudget")}
            value={flatmateFilters.maxBudget ?? ""}
            onChange={(e) => setFlatmateFilters({ ...flatmateFilters, maxBudget: Number(e.target.value) || undefined })}
          />
        </Card>
      )}

      <div className="mx-auto max-w-xl">
        <SwipeDeck />
      </div>
    </div>
  );
}
