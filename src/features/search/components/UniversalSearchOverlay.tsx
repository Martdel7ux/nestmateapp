import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import { useSearch } from "@/contexts/search-context";
import { useUniversalSearch } from "@/features/search/hooks/use-universal-search";
import { useRecentSearches } from "@/features/search/hooks/use-recent-searches";
import { useKeyboardShortcut } from "@/features/search/hooks/use-keyboard-shortcut";
import { SearchFilterChips } from "@/features/search/components/SearchFilterChips";
import { SearchResultGroup } from "@/features/search/components/SearchResultGroup";
import { FeatureResultRow, ContentResultRow } from "@/features/search/components/SearchResultRow";
import { SUGGESTED_SEARCHES } from "@/features/search/data/suggested-searches";

export function UniversalSearchOverlay() {
  const { isOpen, open, close } = useSearch();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { recents, add: addRecent, remove: removeRecent, clear: clearRecents } = useRecentSearches();
  const { results, isFetching, hasResults, active } = useUniversalSearch(query, filter);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setFilter("all");
    }
  }, [isOpen]);

  // Global keyboard shortcuts — overlay is always mounted, so these work on every page
  useKeyboardShortcut("Escape", close);
  useKeyboardShortcut("k", open, { ctrl: true });

  function handleNavigate(href: string) {
    addRecent(query.trim() || href);
    close();
    navigate(href);
  }

  function handleSuggestedSearch(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  function handleRecentClick(term: string) {
    setQuery(term);
    inputRef.current?.focus();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            key="search-panel"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-[91] mx-auto max-w-lg"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" } as React.CSSProperties}
          >
            <div className="mx-3 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-background shadow-2xl">

              {/* Search input row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {isFetching
                  ? <Loader2 size={17} className="shrink-0 text-primary animate-spin" />
                  : <Search size={17} className="shrink-0 text-muted-foreground" />
                }
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search features, notes, properties…"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted/80 transition"
                >
                  esc
                </button>
              </div>

              {/* Filter chips — only show when query is active */}
              {active && (
                <SearchFilterChips active={filter} onChange={setFilter} />
              )}

              <div className="max-h-[70vh] overflow-y-auto overscroll-contain pb-2">

                {/* ── Active search results ── */}
                {active && hasResults && (
                  <>
                    {results.features.length > 0 && (
                      <SearchResultGroup label="Features">
                        {results.features.map((entry) => (
                          <FeatureResultRow key={entry.href} entry={entry} onNavigate={handleNavigate} />
                        ))}
                      </SearchResultGroup>
                    )}
                    {results.opportunities.length > 0 && (
                      <SearchResultGroup label="Opportunities">
                        {results.opportunities.map((r) => (
                          <ContentResultRow key={r.id} result={r} onNavigate={handleNavigate} />
                        ))}
                      </SearchResultGroup>
                    )}
                    {results.notes.length > 0 && (
                      <SearchResultGroup label="Notes">
                        {results.notes.map((r) => (
                          <ContentResultRow key={r.id} result={r} onNavigate={handleNavigate} />
                        ))}
                      </SearchResultGroup>
                    )}
                    {results.properties.length > 0 && (
                      <SearchResultGroup label="Properties">
                        {results.properties.map((r) => (
                          <ContentResultRow key={r.id} result={r} onNavigate={handleNavigate} />
                        ))}
                      </SearchResultGroup>
                    )}
                    {results.documents.length > 0 && (
                      <SearchResultGroup label="Documents">
                        {results.documents.map((r) => (
                          <ContentResultRow key={r.id} result={r} onNavigate={handleNavigate} />
                        ))}
                      </SearchResultGroup>
                    )}
                  </>
                )}

                {/* ── No results state ── */}
                {active && !hasResults && !isFetching && (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Search size={28} className="text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-foreground">No results for "{query}"</p>
                    <p className="text-xs text-muted-foreground">Try a different term or browse by feature</p>
                  </div>
                )}

                {/* ── Idle state: recents + suggestions ── */}
                {!active && (
                  <>
                    {recents.length > 0 && (
                      <SearchResultGroup label="Recent">
                        {recents.map((term) => (
                          <div key={term} className="flex items-center gap-3 px-4 py-2.5 group">
                            <Clock size={14} className="shrink-0 text-muted-foreground" />
                            <button
                              type="button"
                              onClick={() => handleRecentClick(term)}
                              className="flex-1 text-left text-sm text-foreground truncate"
                            >
                              {term}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRecent(term)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition"
                              aria-label={`Remove "${term}" from recents`}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        <div className="px-4 pb-1">
                          <button
                            type="button"
                            onClick={clearRecents}
                            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition"
                          >
                            Clear recents
                          </button>
                        </div>
                      </SearchResultGroup>
                    )}

                    <SearchResultGroup label="Try searching for">
                      <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
                        {SUGGESTED_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handleSuggestedSearch(term)}
                            className="flex items-center gap-1 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition"
                          >
                            <ArrowUpRight size={11} />
                            {term}
                          </button>
                        ))}
                      </div>
                    </SearchResultGroup>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
