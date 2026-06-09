import {
  Sparkles, Brush, Wind, Sofa,
  Sunrise, Clock, Moon,
  Home, Users, PartyPopper,
  BookOpen, Shuffle, Library,
  type LucideIcon,
} from "lucide-react";

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
  /** Short text label (used in native <select> options + chips). */
  label: string;
  /** Distinctive icon for chips/badges (native selects can't render these). */
  icon: LucideIcon;
}

export const CLEANLINESS_OPTIONS: readonly LifestyleOption<Cleanliness>[] = [
  { value: "very_tidy", label: "Very tidy", icon: Sparkles },
  { value: "tidy", label: "Tidy", icon: Brush },
  { value: "relaxed", label: "Relaxed", icon: Wind },
  { value: "laid_back", label: "Laid-back", icon: Sofa },
] as const;

export const SLEEP_OPTIONS: readonly LifestyleOption<SleepSchedule>[] = [
  { value: "early_bird", label: "Early bird", icon: Sunrise },
  { value: "flexible", label: "Flexible", icon: Clock },
  { value: "night_owl", label: "Night owl", icon: Moon },
] as const;

export const SOCIAL_OPTIONS: readonly LifestyleOption<SocialHabits>[] = [
  { value: "homebody", label: "Homebody", icon: Home },
  { value: "balanced", label: "Balanced", icon: Users },
  { value: "social", label: "Very social", icon: PartyPopper },
] as const;

export const STUDY_OPTIONS: readonly LifestyleOption<StudyHabits>[] = [
  { value: "at_home", label: "Study at home", icon: BookOpen },
  { value: "mixed", label: "Mixed", icon: Shuffle },
  { value: "library", label: "Library / campus", icon: Library },
] as const;

/** Default (middle / balanced) value used to pre-select form fields. */
export const LIFESTYLE_DEFAULTS = {
  cleanliness: "tidy" as Cleanliness,
  sleep_schedule: "flexible" as SleepSchedule,
  social_habits: "balanced" as SocialHabits,
  study_habits: "mixed" as StudyHabits,
};

/** Look up the full option (label + icon) for a stored value. */
export function lifestyleOption(
  options: readonly LifestyleOption<string>[],
  value: string | null | undefined
): LifestyleOption<string> | null {
  if (!value) return null;
  return options.find((o) => o.value === value) ?? null;
}
