import type { FlatmateListing } from "@/types/supabase";
import {
  CLEANLINESS_OPTIONS,
  SLEEP_OPTIONS,
  SOCIAL_OPTIONS,
  STUDY_OPTIONS,
  type LifestyleOption,
} from "./flatmate-lifestyle";

export type MatchKey = "budget" | "cleanliness" | "sleep" | "social" | "study";

export interface MatchDimension {
  key: MatchKey;
  label: string;
  /** 0–100 compatibility on this single dimension. */
  score: number;
}

export interface MatchResult {
  /** 0–100 weighted overall compatibility. */
  overall: number;
  /** Per-dimension scores, only for dimensions present on BOTH listings. */
  dimensions: MatchDimension[];
}

const WEIGHTS: Record<MatchKey, number> = {
  budget: 0.3,
  cleanliness: 0.2,
  sleep: 0.2,
  social: 0.15,
  study: 0.15,
};

/** Closeness of two ordinal choices: identical = 1, opposite ends = 0. */
function ordinalScore(aIdx: number, bIdx: number, levels: number): number {
  if (levels <= 1) return 1;
  return 1 - Math.abs(aIdx - bIdx) / (levels - 1);
}

function indexOf(
  options: readonly LifestyleOption<string>[],
  value: string | null | undefined
): number | null {
  if (!value) return null;
  const i = options.findIndex((o) => o.value === value);
  return i === -1 ? null : i;
}

function priceProximity(a: number, b: number): number {
  const tolerance = Math.max(200, ((a + b) / 2) * 0.4);
  return Math.max(0, 1 - Math.abs(a - b) / tolerance);
}

function rangeOverlap(a: FlatmateListing, b: FlatmateListing): number | null {
  if (!a.min_budget || !a.max_budget || !b.min_budget || !b.max_budget) return null;
  const lo = Math.max(a.min_budget, b.min_budget);
  const hi = Math.min(a.max_budget, b.max_budget);
  const overlap = Math.max(0, hi - lo);
  const smaller = Math.min(a.max_budget - a.min_budget, b.max_budget - b.min_budget);
  return Math.min(1, overlap / Math.max(smaller, 1));
}

/** Budget compatibility (0–1) or null when there isn't enough data. */
function budgetScore(me: FlatmateListing, them: FlatmateListing): number | null {
  const meSeeking = me.housing_status === "seeking_flat";
  const themSeeking = them.housing_status === "seeking_flat";

  // Normal complementary case: one seeks (has a budget range), one offers a flat.
  let range: [number, number] | null = null;
  let price: number | null = null;

  if (meSeeking && !themSeeking) {
    range = me.min_budget && me.max_budget ? [me.min_budget, me.max_budget] : null;
    price = them.flat_price ?? null;
  } else if (!meSeeking && themSeeking) {
    range = them.min_budget && them.max_budget ? [them.min_budget, them.max_budget] : null;
    price = me.flat_price ?? null;
  } else if (meSeeking && themSeeking) {
    return rangeOverlap(me, them);
  } else {
    return me.flat_price && them.flat_price ? priceProximity(me.flat_price, them.flat_price) : null;
  }

  if (!range || price == null || price <= 0) return null;
  const [min, max] = range;
  if (price >= min && price <= max) return 1;
  const mid = (min + max) / 2 || max || 1;
  const over = price < min ? min - price : price - max;
  const tolerance = Math.max(150, mid * 0.4);
  return Math.max(0, 1 - over / tolerance);
}

interface RawDimension {
  key: MatchKey;
  label: string;
  weight: number;
  score: number; // 0–1
}

/**
 * Compute a 0–100 roommate compatibility score between the viewer's listing and
 * a candidate, plus a per-dimension breakdown. Dimensions missing on either side
 * are skipped and the remaining weights are renormalized, so an incomplete
 * profile still yields a fair score from whatever data exists.
 */
export function computeMatchScore(me: FlatmateListing, them: FlatmateListing): MatchResult {
  const raw: RawDimension[] = [];

  const budget = budgetScore(me, them);
  if (budget !== null) {
    raw.push({ key: "budget", label: "Budget", weight: WEIGHTS.budget, score: budget });
  }

  const ordinal = (
    key: MatchKey,
    label: string,
    options: readonly LifestyleOption<string>[],
    a: string | null | undefined,
    b: string | null | undefined
  ) => {
    const ai = indexOf(options, a);
    const bi = indexOf(options, b);
    if (ai === null || bi === null) return;
    raw.push({ key, label, weight: WEIGHTS[key], score: ordinalScore(ai, bi, options.length) });
  };

  ordinal("cleanliness", "Cleanliness", CLEANLINESS_OPTIONS, me.cleanliness, them.cleanliness);
  ordinal("sleep", "Sleep schedule", SLEEP_OPTIONS, me.sleep_schedule, them.sleep_schedule);
  ordinal("social", "Social habits", SOCIAL_OPTIONS, me.social_habits, them.social_habits);
  ordinal("study", "Study habits", STUDY_OPTIONS, me.study_habits, them.study_habits);

  const totalWeight = raw.reduce((sum, d) => sum + d.weight, 0);
  const overall =
    totalWeight > 0
      ? Math.round((raw.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight) * 100)
      : 0;

  return {
    overall,
    dimensions: raw.map((d) => ({ key: d.key, label: d.label, score: Math.round(d.score * 100) })),
  };
}

/** Tier + tailwind color classes for a score, used for badges/bars. */
export function matchTier(score: number): { label: string; text: string; bg: string; bar: string } {
  if (score >= 85) return { label: "Great match", text: "text-emerald-600", bg: "bg-emerald-500", bar: "bg-emerald-500" };
  if (score >= 70) return { label: "Good match", text: "text-sky-600", bg: "bg-sky-500", bar: "bg-sky-500" };
  if (score >= 50) return { label: "Fair match", text: "text-amber-600", bg: "bg-amber-500", bar: "bg-amber-500" };
  return { label: "Low match", text: "text-rose-600", bg: "bg-rose-500", bar: "bg-rose-500" };
}
