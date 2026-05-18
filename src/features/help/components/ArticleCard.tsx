import { Link } from "react-router-dom";
import { Clock, ChevronRight } from "lucide-react";
import type { HelpArticle, HelpSearchResult } from "@/types/help";

type Article = HelpArticle | HelpSearchResult;

interface Props {
  article: Article;
  showCategory?: boolean;
}

export function ArticleCard({ article, showCategory = false }: Props) {
  const categorySlug = "category" in article && article.category
    ? (article.category as any).slug
    : "category_slug" in article
      ? article.category_slug
      : null;

  const categoryName = "category" in article && article.category
    ? (article.category as any).name
    : "category_name" in article
      ? article.category_name
      : null;

  return (
    <Link
      to={`/profile/help/article/${article.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition hover:bg-muted/40 active:scale-[0.98]"
    >
      <div className="flex-1 min-w-0">
        {showCategory && categoryName && (
          <span className="mb-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {categoryName}
          </span>
        )}
        <p className="truncate text-sm font-semibold text-foreground">{article.title}</p>
        {article.summary && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{article.summary}</p>
        )}
        {article.estimated_read_minutes && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Clock size={10} />
            <span>{article.estimated_read_minutes} min read</span>
          </div>
        )}
      </div>
      <ChevronRight size={15} className="shrink-0 text-muted-foreground/40" />
    </Link>
  );
}
