import { Recycle, Leaf, Trash2, Package } from "lucide-react";
import type { GarbageSchedule } from "@/types/tools";
import { PickupDayBadge } from "./PickupDayBadge";

interface Props {
  schedule: GarbageSchedule;
}

export function ScheduleDisplay({ schedule: s }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 divide-y divide-border">
      {/* General waste */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
          <Trash2 size={14} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-1">General Waste</p>
          <PickupDayBadge days={s.general_waste_days} color="green" />
        </div>
      </div>

      {/* Recycling */}
      {s.recycling_days.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mt-0.5">
            <Recycle size={14} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">Recycling</p>
            <PickupDayBadge days={s.recycling_days} color="blue" />
          </div>
        </div>
      )}

      {/* Organic */}
      {s.organic_days.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mt-0.5">
            <Leaf size={14} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">Organic / Food Waste</p>
            <PickupDayBadge days={s.organic_days} color="green" />
          </div>
        </div>
      )}

      {/* Bulky */}
      {s.bulky_waste_info && (
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 mt-0.5">
            <Package size={14} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Bulky Waste</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.bulky_waste_info}</p>
          </div>
        </div>
      )}
    </div>
  );
}
