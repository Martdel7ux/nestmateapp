import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FEATURE_INDEX } from "@/features/search/data/feature-index";
import { searchFeatures } from "@/features/search/utils/search-scoring";
import type { FeatureEntry } from "@/features/search/data/feature-index";

export interface ContentResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  thumbnail_url: string | null;
  href: string;
  badge: string;
}

export interface SearchResults {
  features: FeatureEntry[];
  opportunities: ContentResult[];
  notes: ContentResult[];
  properties: ContentResult[];
  documents: ContentResult[];
}

const EMPTY: SearchResults = { features: [], opportunities: [], notes: [], properties: [], documents: [] };

export function useUniversalSearch(query: string, filter: string) {
  const [debounced, setDebounced] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(timer.current);
  }, [query]);

  const active = debounced.trim().length >= 2;

  const { data: contentRaw, isFetching } = useQuery({
    queryKey: ["universalSearch", debounced],
    queryFn: async (): Promise<SearchResults> => {
      if (!supabase) return EMPTY;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return EMPTY;
      const { data, error } = await supabase.rpc("universal_search", {
        p_user_id: user.id,
        p_query:   debounced,
        p_limit:   5,
      });
      if (error || !data) return EMPTY;
      return {
        features:      [],
        opportunities: data.opportunities ?? [],
        notes:         data.notes         ?? [],
        properties:    data.properties    ?? [],
        documents:     data.documents     ?? [],
      };
    },
    enabled: active,
    staleTime: 5 * 60 * 1000,
  });

  const features = active ? searchFeatures(debounced, FEATURE_INDEX) : [];
  const content  = contentRaw ?? EMPTY;

  // Apply filter chip
  function applyFilter(results: SearchResults): SearchResults {
    if (filter === "all" || !filter) return { ...results, features };
    if (filter === "features")     return { ...EMPTY, features };
    if (filter === "events")       return { ...EMPTY, features: [], opportunities: results.opportunities };
    if (filter === "notes")        return { ...EMPTY, features: [], notes: results.notes };
    if (filter === "properties")   return { ...EMPTY, features: [], properties: results.properties };
    if (filter === "documents")    return { ...EMPTY, features: [], documents: results.documents };
    return { ...results, features };
  }

  const results = active ? applyFilter({ ...content, features }) : EMPTY;
  const hasResults = Object.values(results).some((arr) => arr.length > 0);

  return { results, isFetching: active && isFetching, hasResults, active };
}
