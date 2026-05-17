import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { calculateBillEstimate } from "@/utils/billsCalculator";
import type { BillsInput, BillEstimate, BillRange } from "@/types/tools";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

const DEFAULTS: BillsInput = {
  bedrooms: 1, people: 2, floor: "upper",
  acUnits: 1, hotWater: "solar", internet: "not_included",
  hasDishwasher: false, hasWashingMachine: true,
  city: "nicosia",
};

function fmt(r: BillRange) {
  return `€${r.min}–€${r.max}`;
}

function BillRow({ label, range }: { label: string; range: BillRange }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{fmt(range)}</span>
    </div>
  );
}

function SeasonCard({ title, breakdown }: { title: string; breakdown: BillEstimate["summer"] }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <p className="text-sm font-bold text-foreground mb-3">{title}</p>
      <BillRow label="Electricity (EAC)" range={breakdown.electricity} />
      <BillRow label="Water"              range={breakdown.water} />
      <BillRow label="Internet"           range={breakdown.internet} />
      <div className="flex justify-between items-center pt-2 mt-1">
        <span className="text-sm font-bold text-foreground">Total</span>
        <span className="text-base font-bold text-primary">{fmt(breakdown.total)}/mo</span>
      </div>
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)}
        className={cn("h-6 w-11 rounded-full transition-colors shrink-0", value ? "bg-primary" : "bg-muted")}>
        <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5",
          value ? "translate-x-5" : "translate-x-0")} />
      </button>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

export function BillsCalculatorPage() {
  const [form,     setForm]     = useState<BillsInput>(DEFAULTS);
  const [estimate, setEstimate] = useState<BillEstimate | null>(null);
  const [showHow,  setShowHow]  = useState(false);

  function set<K extends keyof BillsInput>(key: K, val: BillsInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setEstimate(null);
  }

  function calculate() {
    setEstimate(calculateBillEstimate(form));
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Summer Bills Calculator" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-5">
        {/* Intro */}
        <div className="rounded-2xl bg-primary/5 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Estimate your monthly utility costs as a student in Cyprus. Fill in your flat's details for a realistic breakdown.
          </p>
        </div>

        {/* City */}
        <div>
          <label className={labelCls}>City</label>
          <div className="grid grid-cols-2 gap-2">
            {(["nicosia","limassol","larnaca","paphos"] as const).map((c) => (
              <button key={c} type="button" onClick={() => set("city", c)}
                className={cn("rounded-2xl py-2.5 text-sm font-semibold border capitalize transition-all",
                  form.city === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms + people */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Bedrooms</label>
            <div className="flex gap-1">
              {([1,2,3,4] as const).map((n) => (
                <button key={n} type="button" onClick={() => set("bedrooms", n)}
                  className={cn("flex-1 rounded-xl py-2.5 text-sm font-semibold border transition-all",
                    form.bedrooms === n ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                  {n === 4 ? "4+" : n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>People</label>
            <input type="number" min={1} max={6} value={form.people}
              onChange={(e) => set("people", Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
              className={inputCls} />
          </div>
        </div>

        {/* Floor */}
        <div>
          <label className={labelCls}>Floor type</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["ground", "Ground floor"],
              ["upper",  "Upper floor"],
              ["top",    "Top / under roof"],
            ] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("floor", v)}
                className={cn("rounded-2xl py-2.5 text-xs font-semibold border transition-all text-center",
                  form.floor === v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* AC units */}
        <div>
          <label className={labelCls}>AC units</label>
          <div className="flex gap-2">
            {([0,1,2,3] as const).map((n) => (
              <button key={n} type="button" onClick={() => set("acUnits", n)}
                className={cn("flex-1 rounded-2xl py-2.5 text-sm font-semibold border transition-all",
                  form.acUnits === n ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                {n === 3 ? "3+" : n}
              </button>
            ))}
          </div>
        </div>

        {/* Hot water */}
        <div>
          <label className={labelCls}>Hot water</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["electric", "Electric heater"],
              ["solar",    "Solar (geysir)"],
              ["gas",      "Gas"],
            ] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("hotWater", v)}
                className={cn("rounded-2xl py-2.5 text-xs font-semibold border transition-all",
                  form.hotWater === v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Internet */}
        <div>
          <label className={labelCls}>Internet</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["included",     "Included"],
              ["not_included", "Not included"],
              ["unsure",       "Unsure"],
            ] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => set("internet", v)}
                className={cn("rounded-2xl py-2.5 text-xs font-semibold border transition-all",
                  form.internet === v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Appliance toggles */}
        <div className="space-y-3">
          <Toggle value={form.hasDishwasher}    onChange={(v) => set("hasDishwasher", v)}    label="Has dishwasher" />
          <Toggle value={form.hasWashingMachine} onChange={(v) => set("hasWashingMachine", v)} label="Has washing machine" />
        </div>

        {/* Calculate */}
        <button type="button" onClick={calculate}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground">
          Calculate
        </button>

        {/* Results */}
        {estimate && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-foreground">Your estimated bills</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SeasonCard title="☀️  Summer (Jun–Sep)" breakdown={estimate.summer} />
              <SeasonCard title="🌧️  Winter (Nov–Mar)" breakdown={estimate.winter} />
            </div>

            {/* Tips */}
            {estimate.tips.length > 0 && (
              <div className="space-y-2">
                {estimate.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                    <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* How it's calculated */}
            <div className="rounded-2xl border border-border bg-background/60 overflow-hidden">
              <button type="button"
                onClick={() => setShowHow((s) => !s)}
                className="w-full flex items-center justify-between px-4 py-3">
                <span className="text-sm font-semibold text-foreground">How is this calculated?</span>
                {showHow ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showHow && (
                <div className="px-4 pb-4 text-xs text-muted-foreground space-y-1.5">
                  <p>Estimates are based on EAC published tariffs and typical consumption patterns for Cyprus student households.</p>
                  <p>Electricity: base load (lights, fridge, devices) + AC contribution by unit count + floor type + city climate + hot water type + appliances.</p>
                  <p>Inland cities like Nicosia are typically 4–6°C hotter than the coast in summer, driving higher AC usage.</p>
                  <p>These are estimates, not guarantees. Your actual bill depends on usage habits, flat insulation, and current EAC tariffs.</p>
                  <p className="font-semibold">Updated: May 2026 · Source: EAC published residential tariffs</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
