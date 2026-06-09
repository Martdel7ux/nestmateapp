// Lifestyle dimensions used by the roommate Match Score.
//
// Each option list is ordered from one extreme to the other; the array INDEX is
// the ordinal value used for compatibility distance (closer = more compatible).
// Keep these in sync with the enums in 20260609000001_flatmate_lifestyle.sql.

export type Cleanliness = "very_tidy" | "tidy" | "relaxed" | "laid_back";
export type SleepSchedule = "early_bird" | "flexible" | "night_owl";
export type SocialHabits = "homebody" | "balanced" | "social";
export type StudyHabits = "at_home" | "mixed" | "library";

export interface LifestyleOption<T extends string> {
  value: T;
  /** Short label for selects / chips. */
  label: string;
}

export const CLEANLINESS_OPTIONS: readonly LifestyleOption<Cleanliness>[] = [
  { value: "very_tidy", label: "Very tidy ✨" },
  { value: "tidy", label: "Tidy" },
  { value: "relaxed", label: "Relaxed" },
  { value: "laid_back", label: "Laid-back" },
] as const;

export const SLEEP_OPTIONS: readonly LifestyleOption<SleepSchedule>[] = [
  { value: "early_bird", label: "Early bird 🌅" },
  { value: "flexible", label: "Flexible" },
  { value: "night_owl", label: "Night owl 🌙" },
] as const;

export const SOCIAL_OPTIONS: readonly LifestyleOption<SocialHabits>[] = [
  { value: "homebody", label: "Homebody 🏠" },
  { value: "balanced", label: "Balanced" },
  { value: "social", label: "Very social 🎉" },
] as const;

export const STUDY_OPTIONS: readonly LifestyleOption<StudyHabits>[] = [
  { value: "at_home", label: "Study at home" },
  { value: "mixed", label: "Mixed" },
  { value: "library", label: "Library / campus" },
] as const;

/** Default (middle / balanced) value used to pre-select form fields. */
export const LIFESTYLE_DEFAULTS = {
  cleanliness: "tidy" as Cleanliness,
  sleep_schedule: "flexible" as SleepSchedule,
  social_habits: "balanced" as SocialHabits,
  study_habits: "mixed" as StudyHabits,
};

/** Look up the human label for a stored value (for chips / breakdown rows). */
export function lifestyleLabel(
  options: readonly LifestyleOption<string>[],
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? null;
}
