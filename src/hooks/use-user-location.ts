// LOCATION RULE: Always read user location via useUserLocation(). Never query profiles.city directly.
import { useMemo } from "react";
import { useData } from "@/contexts/data-context";

// Maps Profile.city (capitalized) → lowercase key used by tool tables
export const CITY_TO_KEY: Record<string, string> = {
  Nicosia:   "nicosia",
  Limassol:  "limassol",
  Larnaca:   "larnaca",
  Paphos:    "paphos",
  Famagusta: "famagusta",
  Kyrenia:   "nicosia",
};

export interface UserLocation {
  city: string | null;
  cityKey: string | null;       // lowercase, used for tool table queries
  area: string | null;
  streetAddress: string | null;
  postalCode: string | null;
  university: string | null;
  isComplete: boolean;          // city + area both set
  isSkipped: boolean;           // user explicitly skipped (set_at set but city null)
  setAt: Date | null;
  confirmedAt: Date | null;
  monthsSinceConfirmed: number | null;
}

export function useUserLocation(): UserLocation {
  const { snapshot } = useData();
  const p = snapshot.profile;

  return useMemo(() => {
    const city = p.city ?? null;
    const setAt      = p.location_set_at      ? new Date(p.location_set_at)      : null;
    const confirmedAt = p.location_confirmed_at ? new Date(p.location_confirmed_at) : null;
    const reference   = confirmedAt ?? setAt;
    const monthsSinceConfirmed = reference
      ? (Date.now() - reference.getTime()) / (1000 * 60 * 60 * 24 * 30)
      : null;

    return {
      city,
      cityKey:      city ? (CITY_TO_KEY[city] ?? city.toLowerCase()) : null,
      area:         p.area          ?? null,
      streetAddress: p.street_address ?? null,
      postalCode:   p.postal_code   ?? null,
      university:   p.university    ?? null,
      isComplete:   Boolean(city && p.area),
      isSkipped:    Boolean(setAt && !city),
      setAt,
      confirmedAt,
      monthsSinceConfirmed,
    };
  }, [p]);
}
