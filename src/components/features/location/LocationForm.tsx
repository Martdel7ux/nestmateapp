import { useState, useEffect } from "react";
import { MapPin, Building2, Home, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cities } from "@/lib/constants";
import { CYPRUS_UNIVERSITIES } from "@/lib/universities";
import { CITY_TO_KEY } from "@/hooks/use-user-location";
import { useCyprusAreas } from "@/hooks/use-cyprus-areas";
import type { City } from "@/types/supabase";

export interface LocationFormValues {
  city: City;
  area: string;
  streetAddress: string;
  postalCode: string;
  university: string;
}

interface LocationFormProps {
  initial?: Partial<LocationFormValues>;
  onSubmit: (values: LocationFormValues) => Promise<void>;
  submitLabel?: string;
  onSkip?: () => void;
}

export function LocationForm({ initial, onSubmit, submitLabel = "Continue", onSkip }: LocationFormProps) {
  const [city, setCity]               = useState<City>(initial?.city ?? "Nicosia");
  const [area, setArea]               = useState(initial?.area ?? "");
  const [streetAddress, setStreet]    = useState(initial?.streetAddress ?? "");
  const [postalCode, setPostal]       = useState(initial?.postalCode ?? "");
  const [university, setUniversity]   = useState(initial?.university ?? "");
  const [errors, setErrors]           = useState<{ city?: string; area?: string }>({});
  const [saving, setSaving]           = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);

  const cityKey = CITY_TO_KEY[city] ?? city.toLowerCase();
  const { data: areas = [], isLoading: areasLoading } = useCyprusAreas(cityKey);

  // Reset area when city changes
  useEffect(() => {
    if (initial?.city && city === initial.city) return;
    setArea("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  function validate() {
    const e: { city?: string; area?: string } = {};
    if (!city) e.city = "Please select your city";
    if (!area) e.area = "Please select your area";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({ city, area, streetAddress, postalCode, university });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* City */}
        <div className="space-y-1.5">
          <label htmlFor="loc-city" className="flex items-center gap-2 text-sm font-medium">
            <MapPin size={14} className="text-primary" />
            City <span className="text-destructive">*</span>
          </label>
          <Select
            id="loc-city"
            value={city}
            aria-required="true"
            onChange={(e) => setCity(e.target.value as City)}
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>

        {/* Area */}
        <div className="space-y-1.5">
          <label htmlFor="loc-area" className="flex items-center gap-2 text-sm font-medium">
            <Building2 size={14} className="text-primary" />
            Area / Neighbourhood <span className="text-destructive">*</span>
          </label>
          <Select
            id="loc-area"
            value={area}
            aria-required="true"
            onChange={(e) => setArea(e.target.value)}
            disabled={areasLoading || areas.length === 0}
          >
            <option value="">
              {areasLoading ? "Loading areas…" : "Select your area"}
            </option>
            {areas.map((a) => (
              <option key={a.id} value={a.area_name}>{a.area_name}</option>
            ))}
          </Select>
          {errors.area && <p className="text-xs text-destructive">{errors.area}</p>}
        </div>

        {/* Street address (optional) */}
        <div className="space-y-1.5">
          <label htmlFor="loc-street" className="flex items-center gap-2 text-sm font-medium">
            <Home size={14} className="text-muted-foreground" />
            Street address
            <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </label>
          <Input
            id="loc-street"
            value={streetAddress}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. 12 Makarios Ave"
          />
          <p className="text-[11px] text-muted-foreground">
            Helps with rent reminders and document organization.
          </p>
        </div>

        {/* University (optional) */}
        <div className="space-y-1.5">
          <label htmlFor="loc-uni" className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap size={14} className="text-muted-foreground" />
            University
            <span className="text-xs font-normal text-muted-foreground">(if you're a student)</span>
          </label>
          <Select
            id="loc-uni"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          >
            <option value="">Not a student / skip</option>
            {CYPRUS_UNIVERSITIES.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </div>

        <Button type="submit" disabled={saving} className="w-full h-12 text-base font-semibold mt-2">
          {saving ? "Saving…" : submitLabel}
        </Button>
      </form>

      {/* Skip option */}
      {onSkip && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setSkipConfirm(true)}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Skip confirmation sheet */}
      {skipConfirm && onSkip && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={() => setSkipConfirm(false)}
          />
          <div className="fixed inset-x-4 bottom-6 z-[210] rounded-[2rem] bg-background p-6 shadow-card">
            <h3 className="text-center font-display text-lg font-bold">Skip location setup?</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Some features won't work without your location. You can set this later in
              Profile → Location Settings.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={() => { setSkipConfirm(false); onSkip(); }}
                variant="outline"
                className="w-full"
              >
                Skip anyway
              </Button>
              <Button
                onClick={() => setSkipConfirm(false)}
                className="w-full"
              >
                Set my location
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
