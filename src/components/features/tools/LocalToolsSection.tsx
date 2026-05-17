import { Zap, Bus, Trash2, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useNextOutage } from "@/hooks/use-tools";
import { ToolTile } from "./ToolTile";
import type { CyprusDistrict } from "@/types/tools";

function formatOutageSublabel(starts: string, ends: string): string {
  const now   = new Date();
  const start = new Date(starts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff  = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);

  const time = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (start <= now) return `Ongoing until ${new Date(ends).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  if (diff === 0)   return `Today ${time}`;
  if (diff === 1)   return `Tomorrow ${time}`;
  return `${start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}

function OutageAwareTile({ district }: { district: CyprusDistrict }) {
  const { data: outage } = useNextOutage(district);
  const sublabel = outage
    ? formatOutageSublabel(outage.starts_at, outage.ends_at)
    : undefined;

  return (
    <ToolTile
      to="/tools/outages"
      icon={Zap}
      label="Power Outages"
      sublabel={sublabel}
      color="linear-gradient(135deg, #c9a227 0%, #e8c547 100%)"
      urgent={!!outage}
    />
  );
}

const CITY_TO_DISTRICT: Record<string, CyprusDistrict> = {
  Nicosia:   "nicosia",
  Limassol:  "limassol",
  Larnaca:   "larnaca",
  Paphos:    "paphos",
  Famagusta: "famagusta",
  Kyrenia:   "nicosia",
};

export function LocalToolsSection() {
  const { user }     = useAuth();
  const { snapshot } = useData();
  const city         = snapshot.profile.city ?? "";
  const district     = CITY_TO_DISTRICT[city] ?? "nicosia";

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28, duration: 0.35 }}
    >
      <p className="mb-3 text-[14px] font-semibold text-foreground">Local Tools</p>
      <div className="-mx-5">
        <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none snap-x snap-mandatory">
          {[
            <motion.div key="bills" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.3 }} className="snap-start">
              <ToolTile
                to="/tools/bills-calculator"
                icon={Calculator}
                label="Summer Bills"
                sublabel="Estimate monthly costs"
                color="linear-gradient(135deg, #e85d3a 0%, #f0845e 100%)"
              />
            </motion.div>,

            <motion.div key="outage" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.37, duration: 0.3 }} className="snap-start">
              <OutageAwareTile district={district} />
            </motion.div>,

            <motion.div key="buses" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.44, duration: 0.3 }} className="snap-start">
              <ToolTile
                to="/tools/buses"
                icon={Bus}
                label="Bus Routes"
                sublabel="UNIC · UCY · CUT · EUC"
                color="linear-gradient(135deg, #1a7fd4 0%, #3a9fd4 100%)"
              />
            </motion.div>,

            <motion.div key="garbage" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.51, duration: 0.3 }} className="snap-start">
              <ToolTile
                to="/tools/garbage"
                icon={Trash2}
                label="Garbage Days"
                sublabel="Collection schedule"
                color="linear-gradient(135deg, #3a8f4f 0%, #5aaf6f 100%)"
              />
            </motion.div>,
          ]}
        </div>
      </div>
    </motion.div>
  );
}
