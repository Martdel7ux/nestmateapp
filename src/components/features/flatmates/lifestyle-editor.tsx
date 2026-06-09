import { useState } from "react";
import { ChevronRight, Sliders } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/data-context";
import {
  CLEANLINESS_OPTIONS, SLEEP_OPTIONS, SOCIAL_OPTIONS, STUDY_OPTIONS, LIFESTYLE_DEFAULTS,
  type Cleanliness, type SleepSchedule, type SocialHabits, type StudyHabits,
} from "@/lib/flatmate-lifestyle";

/**
 * Collapsible editor that lets a user set/update the lifestyle attributes that
 * drive their Match Score. Shown on the flatmates browse view so existing users
 * (whose listings predate the feature) can fill these in.
 */
export function LifestyleEditor() {
  const { myFlatmateListing, updateMyLifestyle } = useData();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cleanliness, setCleanliness] = useState<Cleanliness>(
    myFlatmateListing?.cleanliness ?? LIFESTYLE_DEFAULTS.cleanliness
  );
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule>(
    myFlatmateListing?.sleep_schedule ?? LIFESTYLE_DEFAULTS.sleep_schedule
  );
  const [socialHabits, setSocialHabits] = useState<SocialHabits>(
    myFlatmateListing?.social_habits ?? LIFESTYLE_DEFAULTS.social_habits
  );
  const [studyHabits, setStudyHabits] = useState<StudyHabits>(
    myFlatmateListing?.study_habits ?? LIFESTYLE_DEFAULTS.study_habits
  );

  const incomplete = !myFlatmateListing?.cleanliness;

  async function save() {
    setSaving(true);
    await updateMyLifestyle({ cleanliness, sleepSchedule, socialHabits, studyHabits });
    setSaving(false);
    setOpen(false);
  }

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sliders size={16} />
          </div>
          <div>
            <span className="font-medium">Your match preferences</span>
            {incomplete && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Set these to unlock accurate match scores
              </p>
            )}
          </div>
        </div>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cleanliness</label>
              <Select value={cleanliness} onChange={(e) => setCleanliness(e.target.value as Cleanliness)}>
                {CLEANLINESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sleep schedule</label>
              <Select value={sleepSchedule} onChange={(e) => setSleepSchedule(e.target.value as SleepSchedule)}>
                {SLEEP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Social habits</label>
              <Select value={socialHabits} onChange={(e) => setSocialHabits(e.target.value as SocialHabits)}>
                {SOCIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Study habits</label>
              <Select value={studyHabits} onChange={(e) => setStudyHabits(e.target.value as StudyHabits)}>
                {STUDY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>
          <Button onClick={() => void save()} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      )}
    </Card>
  );
}
