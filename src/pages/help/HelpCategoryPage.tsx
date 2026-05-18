import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ArticleCard } from "@/features/help/components/ArticleCard";
import { fetchArticlesByCategory, fetchHelpCategories } from "@/features/help/api/help-api";

export function HelpCategoryPage() {
  const { slug = "" } = useParams();

  const { data: categories = [] } = useQuery({
    queryKey: ["help", "categories"],
    queryFn:  fetchHelpCategories,
    staleTime: 10 * 60 * 1000,
  });

  const category = categories.find((c) => c.slug === slug);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["help", "category", slug],
    queryFn:  () => fetchArticlesByCategory(slug),
    enabled:  Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={category?.name ?? "Category"}
        universalSearch={false}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 px-5 py-5 pb-32">
          {category?.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No articles yet in this category.
            </p>
          )}

          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
