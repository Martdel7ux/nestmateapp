import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ArticleRenderer } from "@/features/help/components/ArticleRenderer";
import { ArticleFeedbackWidget } from "@/features/help/components/ArticleFeedbackWidget";
import { ArticleCard } from "@/features/help/components/ArticleCard";
import { AskAIButton } from "@/features/help/components/AskAIButton";
import {
  fetchArticleBySlug, fetchRelatedArticles, recordArticleView,
} from "@/features/help/api/help-api";

export function HelpArticlePage() {
  const { slug = "" } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["help", "article", slug],
    queryFn:  () => fetchArticleBySlug(slug),
    staleTime: 5 * 60 * 1000,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["help", "related", article?.id],
    queryFn:  () => fetchRelatedArticles(article!.related_article_ids),
    enabled:  Boolean(article?.related_article_ids?.length),
    staleTime: 10 * 60 * 1000,
  });

  // Record view once per mount
  useEffect(() => {
    if (article?.id) recordArticleView(article.id).catch(() => undefined);
  }, [article?.id]);

  const categorySlug = (article?.category as any)?.slug;
  const categoryName = (article?.category as any)?.name;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={article?.title ?? "Article"}
        universalSearch={false}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !article && (
          <div className="px-5 py-10 text-center">
            <p className="font-semibold text-foreground">Article not found</p>
            <Link to="/profile/help" className="mt-2 text-sm text-primary hover:underline">
              Back to Help
            </Link>
          </div>
        )}

        {article && (
          <div className="px-5 py-5 pb-32 space-y-6">
            {/* Category breadcrumb */}
            {categorySlug && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link to="/profile/help" className="hover:text-foreground transition">Help</Link>
                <ChevronRight size={12} />
                <Link
                  to={`/profile/help/category/${categorySlug}`}
                  className="hover:text-foreground transition"
                >
                  {categoryName}
                </Link>
              </div>
            )}

            {/* Title + meta */}
            <div>
              {categoryName && (
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {categoryName}
                </span>
              )}
              <h1 className="text-2xl font-bold text-foreground leading-snug">{article.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {article.estimated_read_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {article.estimated_read_minutes} min read
                  </span>
                )}
                {article.updated_at && (
                  <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Body */}
            <ArticleRenderer content={article.content} />

            {/* Feedback */}
            <ArticleFeedbackWidget article={article} />

            {/* Related articles */}
            {related.length > 0 && (
              <section>
                <p className="mb-3 text-[13px] font-semibold text-foreground">Related articles</p>
                <div className="space-y-2">
                  {related.map((r) => (
                    <ArticleCard key={r.id} article={r} />
                  ))}
                </div>
              </section>
            )}

            {/* Still need help? */}
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-sm font-semibold text-foreground mb-3">Still have questions?</p>
              <div className="flex flex-wrap gap-2">
                <AskAIButton
                  label="Ask Nestmate AI about this"
                  prompt={`I have a question about: ${article.title}`}
                  context={{ source: "help_article", source_article_id: article.id }}
                />
                <Link
                  to="/profile/help/contact"
                  className="flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/40"
                >
                  Send us a message
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
