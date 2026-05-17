import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, Bell, BellOff } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { useGarbageSchedules, useGarbageSchedule } from "@/hooks/use-tools";
import { ScheduleDisplay } from "@/components/features/tools/garbage/ScheduleDisplay";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";

const CITIES = [
  { value: "nicosia",  label: "Nicosia" },
  { value: "limassol", label: "Limassol" },
  { value: "larnaca",  label: "Larnaca" },
  { value: "paphos",   label: "Paphos" },
];

const CITY_TO_KEY: Record<string, string> = {
  Nicosia: "nicosia", Limassol: "limassol", Larnaca: "larnaca",
  Paphos: "paphos", Famagusta: "nicosia",
};

export function GarbagePage() {
  const { user }         = useAuth();
  const { snapshot }     = useData();
  const userCity         = CITY_TO_KEY[snapshot.profile.city ?? ""] ?? "nicosia";
  const userArea         = snapshot.profile.area ?? "";

  const [city,        setCity]        = useState(userCity);
  const [area,        setArea]        = useState(userArea);
  const [reminderOn,  setReminderOn]  = useState(snapshot.profile.garbage_reminder_enabled ?? false);
  const [saving,      setSaving]      = useState(false);

  const { data: schedules = [] } = useGarbageSchedules(city);
  const { data: schedule }       = useGarbageSchedule(city, area);

  // Sync reminder state from profile
  useEffect(() => {
    setReminderOn(snapshot.profile.garbage_reminder_enabled ?? false);
  }, [snapshot.profile.garbage_reminder_enabled]);

  async function toggleReminder() {
    if (!user || !supabase) return;
    setSaving(true);
    const next = !reminderOn;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ garbage_reminder_enabled: next, area, city })
        .eq("id", user.id);
      if (error) throw error;
      setReminderOn(next);
      toast.success(next ? "Reminder set — we'll notify you the evening before collection." : "Reminder turned off.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const areas = schedules.map((s) => s.area).sort();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Garbage Collection" />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-5">
        {/* City picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">City</p>
          <div className="grid grid-cols-2 gap-2">
            {CITIES.map((c) => (
              <button key={c.value} type="button"
                onClick={() => { setCity(c.value); setArea(""); }}
                className={cn("rounded-2xl py-2.5 text-sm font-semibold border transition-all",
                  city === c.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground")}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Area picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Neighbourhood</p>
          <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
            <option value="">— Select your area —</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Schedule */}
        {area && schedule && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-foreground">{schedule.area}</p>
                <p className="text-xs text-muted-foreground capitalize">{schedule.city} Municipality</p>
              </div>

              {/* Reminder toggle */}
              <button type="button" onClick={toggleReminder} disabled={saving}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all",
                  reminderOn
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}>
                {reminderOn
                  ? <><Bell size={11} /> Reminded</>
                  : <><BellOff size={11} /> Remind me</>
                }
              </button>
            </div>

            <ScheduleDisplay schedule={schedule} />

            {schedule.notes && (
              <p className="text-xs text-muted-foreground">{schedule.notes}</p>
            )}
          </div>
        )}

        {area && !schedule && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Trash2 size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No schedule found for {area}.</p>
          </div>
        )}

        {!area && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Trash2 size={36} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select your city and neighbourhood to see the collection schedule.</p>
          </div>
        )}

        {/* ICS hint */}
        {area && schedule && (
          <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Tip:</span> Enable "Remind me" above — we'll send you an in-app notification the evening before each collection day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
