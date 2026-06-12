import { useMemo, useState } from "react";
import { Filter, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AppHeader } from "@/components/layout/app-header";
import { FlatmateForm } from "@/components/features/flatmates/flatmate-form";
import { SwipeDeck } from "@/components/features/flatmates/swipe-deck";
import { LifestyleEditor } from "@/components/features/flatmates/lifestyle-editor";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { cities } from "@/lib/constants";

export function FlatmatesPage() {
  const { myFlatmateListing, flatmateFilters, setFlatmateFilters, dataLoading, snapshot } = useData();
  const { t } = useI18n();
  const [showFilters, setShowFilters] = useState(false);

  const myListing = myFlatmateListing;

  // Filter options derived from the actual candidate pool, so a user never
  // picks a university/country that returns zero results.
  const availableUniversities = useMemo(() => {
    const set = new Set<string>();
    for (const f of snapshot.flatmates) {
      if (!f.is_approved) continue;
      const u = f.profile?.university?.trim();
      if (u) set.add(u);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [snapshot.flatmates]);

  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const f of snapshot.flatmates) {
      if (!f.is_approved) continue;
      const c = f.country_of_origin?.trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [snapshot.flatmates]);

  // ── Still loading from Supabase: don't flash the form prematurely ──
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── No listing yet: show only the creation form ──
  if (!myListing) {
    return (
      <>
        <AppHeader title={t("flatmatesTitle")} subtitle={t("flatmatesSubtitle")} right={{ type: "none" }} />
        <div className="space-y-6 px-5 pt-4">
          <FlatmateForm />
        </div>
      </>
    );
  }

  // ── Listing exists: show browse view ──
  return (
    <>
      <AppHeader
        title={t("flatmatesTitle")}
        right={{
          type: "custom",
          element: (
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                showFilters
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-[var(--glass-border)] bg-[var(--glass-fill)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] hover:brightness-110"
              }`}
            >
              <Filter size={13} />
              {t("flatmatesFilter")}
            </button>
          ),
        }}
      />
      <div className="space-y-5 px-5 pt-4">

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
          {availableUniversities.length > 0 && (
            <Select
              value={flatmateFilters.university ?? ""}
              onChange={(e) => setFlatmateFilters({ ...flatmateFilters, university: e.target.value || undefined })}
            >
              <option value="">{t("flatmatesAllUnis")}</option>
              {availableUniversities.map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          )}
          {availableCountries.length > 0 && (
            <Select
              value={flatmateFilters.country ?? ""}
              onChange={(e) => setFlatmateFilters({ ...flatmateFilters, country: e.target.value || undefined })}
            >
              <option value="">{t("flatmatesAllCountries")}</option>
              {availableCountries.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          )}
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

      <div className="mx-auto max-w-xl space-y-4">
        <LifestyleEditor />
        <SwipeDeck />
      </div>
    </div>
    </>
  );
}
