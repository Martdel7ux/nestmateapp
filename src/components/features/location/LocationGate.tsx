import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useUpdateLocation } from "@/hooks/use-update-location";
import { LocationForm } from "@/components/features/location/LocationForm";
import type { LocationFormValues } from "@/components/features/location/LocationForm";

const SNOOZE_KEY = "nestmate-location-snooze";
const SNOOZE_HOURS = 24;

function isSnoozed(): boolean {
  const raw = localStorage.getItem(SNOOZE_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  return Date.now() - ts < SNOOZE_HOURS * 60 * 60 * 1000;
}

export function LocationGate() {
  const { user, loading: authLoading } = useAuth();
  const { snapshot } = useData();
  const { saveLocation, skipLocation } = useUpdateLocation();
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const profile = snapshot.profile;

  // Don't render until auth + data are ready
  if (authLoading || !user) return null;
  // If profile city is set, no gate needed
  if (profile.city) return null;
  // If user deliberately skipped and snooze is still active, don't show
  if (profile.location_set_at && isSnoozed()) return null;
  // Session-level dismiss (user closed without skipping)
  if (sessionDismissed) return null;

  async function handleSubmit(values: LocationFormValues) {
    await saveLocation(values);
    // Gate disappears automatically because profile.city is now set (optimistic update)
  }

  async function handleSkip() {
    await skipLocation();
    localStorage.setItem(SNOOZE_KEY, Date.now().toString());
    setSessionDismissed(true);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="location-gate"
        className="fixed inset-0 z-[90] flex flex-col bg-background overflow-y-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-primary via-sky-400 to-primary" />

        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="/logo-blue.png" alt="NestMate" className="h-10 object-contain dark:hidden" />
              <img src="/logo-white.png" alt="NestMate" className="hidden h-10 object-contain dark:block" />
            </div>

            {/* Heading */}
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MapPin size={26} className="text-primary" />
                </div>
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight">
                Where do you live in Cyprus?
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We'll use this to show you the right bus routes, garbage days, events
                nearby, and more. Nestmate never tracks your real-time location.
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <LocationForm
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                submitLabel="Continue →"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
