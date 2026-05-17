import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useUserLocation } from "@/hooks/use-user-location";
import { useUpdateLocation } from "@/hooks/use-update-location";

const SESSION_KEY = "nestmate-location-banner-shown";
const SNOOZE_MONTHS = 1; // snooze for 30 days if dismissed without confirming

export function LocationConfirmationBanner() {
  const location = useUserLocation();
  const { confirmLocation } = useUpdateLocation();
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));
  const [confirming, setConfirming] = useState(false);

  // Only show when: location is complete AND 5+ months since last confirmation
  if (!location.isComplete) return null;
  if (!location.monthsSinceConfirmed || location.monthsSinceConfirmed < 5) return null;
  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmLocation();
      dismiss();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Still in {location.area}, {location.city}?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="inline-flex h-8 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {confirming ? "Saving…" : "Yes, still here"}
              </button>
              <Link
                to="/profile/settings/location"
                className="inline-flex h-8 items-center rounded-full border border-border bg-background px-4 text-xs font-semibold text-foreground transition hover:bg-muted"
                onClick={dismiss}
              >
                Update
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-muted"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
