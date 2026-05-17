import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useUserLocation } from "@/hooks/use-user-location";
import { useUpdateLocation } from "@/hooks/use-update-location";
import { LocationForm } from "@/components/features/location/LocationForm";
import type { LocationFormValues } from "@/components/features/location/LocationForm";
import type { City } from "@/types/supabase";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function LocationSettingsPage() {
  const navigate = useNavigate();
  const location = useUserLocation();
  const { saveLocation } = useUpdateLocation();

  const initial: Partial<LocationFormValues> = {
    city:          (location.city as City | null) ?? undefined,
    area:          location.area    ?? undefined,
    streetAddress: location.streetAddress ?? undefined,
    postalCode:    location.postalCode    ?? undefined,
    university:    location.university    ?? undefined,
  };

  async function handleSubmit(values: LocationFormValues) {
    await saveLocation(values);
    toast.success("Location saved");
    navigate(-1);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-bold">Location Settings</h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-sm px-5 py-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your location is used to show relevant bus routes, garbage schedules, local
              events, and EAC outage alerts. Nestmate never tracks your real-time location.
            </p>
          </motion.div>

          <LocationForm
            initial={initial}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
          />

          {/* Last updated */}
          {location.setAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>Last updated on {formatDate(location.setAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
