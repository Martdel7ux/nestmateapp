import type { FeatureEntry } from "@/features/search/data/feature-index";

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

export function scoreFeature(entry: FeatureEntry, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    if (entry.title.toLowerCase().includes(token))    score += 3;
    if (entry.subtitle.toLowerCase().includes(token)) score += 2;
    if (entry.keywords.some((k) => k.includes(token))) score += 1;
  }
  return score;
}

export function searchFeatures(query: string, entries: FeatureEntry[], limit = 5): FeatureEntry[] {
  if (query.trim().length < 2) return [];
  return entries
    .map((e) => ({ entry: e, score: scoreFeature(e, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
