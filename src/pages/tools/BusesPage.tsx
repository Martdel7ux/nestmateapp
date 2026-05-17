import { useNavigate } from "react-router-dom";
import { Bus } from "lucide-react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/layout/app-header";
import type { UniversityKey } from "@/types/tools";
import { UNIVERSITY_INFO } from "@/types/tools";
import { cn } from "@/lib/utils";

const UNIVERSITIES: UniversityKey[] = ["unic", "ucy", "cut", "euc"];

function UniversityCard({ uni }: { uni: UniversityKey }) {
  const navigate = useNavigate();
  const info     = UNIVERSITY_INFO[uni];

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/tools/buses/${uni}`)}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-4 text-left active:bg-muted/30 transition-colors"
    >
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm",
        info.color
      )}>
        {info.name}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{info.fullName}</p>
        <p className="text-xs text-muted-foreground">{info.city} · Tap to see bus routes</p>
      </div>
      <Bus size={16} className="shrink-0 text-muted-foreground" />
    </motion.button>
  );
}

export function BusesPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="University Bus Routes" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-3">
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            OSY public bus routes and university shuttles serving each campus. Routes are curated and updated each semester.
          </p>
        </div>

        {UNIVERSITIES.map((uni) => (
          <UniversityCard key={uni} uni={uni} />
        ))}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Routes last verified May 2026 · Check official timetables for live changes
        </p>
      </div>
    </div>
  );
}
