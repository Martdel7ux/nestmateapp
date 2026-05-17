import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useData } from "@/contexts/data-context";
import { useOutages } from "@/hooks/use-tools";
import { OutageCard } from "@/components/features/tools/outages/OutageCard";
import type { CyprusDistrict } from "@/types/tools";
import { cn } from "@/lib/utils";

const DISTRICTS: { value: CyprusDistrict | "all"; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "nicosia",   label: "Nicosia" },
  { value: "limassol",  label: "Limassol" },
  { value: "larnaca",   label: "Larnaca" },
  { value: "paphos",    label: "Paphos" },
  { value: "famagusta", label: "Famagusta" },
];

const CITY_TO_DISTRICT: Record<string, CyprusDistrict> = {
  Nicosia: "nicosia", Limassol: "limassol", Larnaca: "larnaca",
  Paphos: "paphos", Famagusta: "famagusta",
};

export function OutagesPage() {
  const navigate     = useNavigate();
  const { snapshot } = useData();
  const userDistrict = CITY_TO_DISTRICT[snapshot.profile.city ?? ""] ?? "nicosia";

  const [district, setDistrict] = useState<CyprusDistrict | "all">(userDistrict);
  const { data: outages = [], isLoading } = useOutages(
    district === "all" ? undefined : district
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="EAC Power Outages" />

      <div className="flex-1 overflow-y-auto">
        {/* District filter */}
        <div className="-mx-0 px-4 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DISTRICTS.map((d) => (
              <button key={d.value} type="button"
                onClick={() => setDistrict(d.value)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all",
                  district === d.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground"
                )}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-28 space-y-2">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoading && outages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CheckCircle size={36} className="text-emerald-500/60" />
              <p className="text-sm font-semibold text-foreground">No planned outages</p>
              <p className="text-xs text-muted-foreground">
                No scheduled power cuts in{" "}
                {district === "all" ? "Cyprus" : district.charAt(0).toUpperCase() + district.slice(1)}{" "}
                right now. Outages are updated daily from EAC.
              </p>
            </div>
          )}

          {outages.length > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mb-1">
              <Zap size={15} className="text-amber-500 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-semibold">{outages.length} planned outage{outages.length !== 1 ? "s" : ""}</span>
                {" "}· Source: EAC (updated daily)
              </p>
            </div>
          )}

          {outages.map((outage) => (
            <OutageCard
              key={outage.id}
              outage={outage}
              onClick={() => navigate(`/tools/outages/${outage.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
