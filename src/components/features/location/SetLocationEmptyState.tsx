import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

interface SetLocationEmptyStateProps {
  feature?: string;
}

export function SetLocationEmptyState({ feature = "this feature" }: SetLocationEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <MapPin size={24} className="text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Set your location</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your location is needed to use {feature}. It only takes a few seconds to set.
        </p>
      </div>
      <Link
        to="/profile/settings/location"
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
      >
        Set my location →
      </Link>
    </div>
  );
}
