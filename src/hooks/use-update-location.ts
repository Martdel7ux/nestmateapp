import { useData } from "@/contexts/data-context";
import { CITY_TO_KEY } from "@/hooks/use-user-location";
import type { City } from "@/types/supabase";

export interface LocationUpdate {
  city: City;
  area: string;
  streetAddress?: string;
  postalCode?: string;
  university?: string;
}

export function useUpdateLocation() {
  const { updateProfile } = useData();

  async function saveLocation(values: LocationUpdate) {
    await updateProfile({
      city:          values.city,
      area:          values.area,
      street_address: values.streetAddress || null,
      postal_code:   values.postalCode    || null,
      university:    values.university    || null,
      location_set_at:      new Date().toISOString(),
      location_confirmed_at: new Date().toISOString(),
    });
    // Update the city key in tools if needed (handled via snapshot sync)
    void CITY_TO_KEY; // ensure import is used
  }

  async function confirmLocation() {
    await updateProfile({
      location_confirmed_at: new Date().toISOString(),
    });
  }

  async function skipLocation() {
    await updateProfile({
      location_set_at: new Date().toISOString(),
      // city left null → isSkipped = true
    });
  }

  return { saveLocation, confirmLocation, skipLocation };
}
