import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { HelpSearchBar } from "@/features/help/components/HelpSearchBar";
import { CategoryCard } from "@/features/help/components/CategoryCard";
import { ArticleCard } from "@/features/help/components/ArticleCard";
import { AskAIButton } from "@/features/help/components/AskAIButton";
import { ContactChannels } from "@/features/help/components/ContactChannels";
import { fetchCategoriesWithCounts, fetchPopularArticles } from "@/features/help/api/help-api";

export function HelpLandingPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["help", "categories"],
    queryFn:  fetchCategoriesWithCounts,
    staleTime: 10 * 60 * 1000,
  });

  const { data: popular = [] } = useQuery({
    queryKey: ["help", "popular"],
    queryFn:  () => fetchPopularArticles(5),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Help & Support" universalSearch={false} />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-5 py-5 pb-32">

          {/* Search */}
          <HelpSearchBar />

          {/* AI handoff card */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Can't find what you're looking for?</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Get instant help from our AI assistant.</p>
                <div className="mt-3">
                  <AskAIButton
                    context={{ source: "help_landing" }}
                    label="Ask Nestmate AI"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <section>
            <p className="mb-3 text-[13px] font-semibold text-foreground">Browse by topic</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>

          {/* Popular articles */}
          {popular.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={13} className="text-muted-foreground" />
                <p className="text-[13px] font-semibold text-foreground">Popular articles</p>
              </div>
              <div className="space-y-2">
                {popular.map((a) => (
                  <ArticleCard key={a.id} article={a} showCategory />
                ))}
              </div>
            </section>
          )}

          {/* Contact */}
          <section>
            <p className="mb-3 text-[13px] font-semibold text-foreground">Still need help?</p>
            <ContactChannels />
          </section>

          {/* My tickets link */}
          <Link
            to="/profile/help/my-tickets"
            className="block text-center text-xs text-primary hover:underline"
          >
            View my support tickets →
          </Link>

        </div>
      </div>
    </div>
  );
}
