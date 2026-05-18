import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { HelpSearchBar } from "@/features/help/components/HelpSearchBar";
import { ArticleCard } from "@/features/help/components/ArticleCard";
import { AskAIButton } from "@/features/help/components/AskAIButton";
import { ContactChannels } from "@/features/help/components/ContactChannels";
import { searchHelpArticles } from "@/features/help/api/help-api";

export function HelpSearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["help", "search", query],
    queryFn:  () => searchHelpArticles(query),
    enabled:  query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Search" universalSearch={false} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-5 py-5 pb-32">

          <HelpSearchBar initialValue={query} />

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && query && results.length > 0 && (
            <section>
              <p className="mb-3 text-[13px] text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
              </p>
              <div className="space-y-2">
                {results.map((r) => (
                  <ArticleCard key={r.id} article={r} showCategory />
                ))}
              </div>
            </section>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Search size={24} className="text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No results for "{query}"</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different term or ask our AI assistant.
                  </p>
                </div>
                <AskAIButton
                  label="Ask Nestmate AI"
                  prompt={query}
                  context={{ source: "help_search" }}
                  size="lg"
                />
              </div>

              <section>
                <p className="mb-3 text-[13px] font-semibold text-foreground">Still need help?</p>
                <ContactChannels subjectHint={query} />
              </section>
            </div>
          )}

          {!query && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Type to search articles…
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
