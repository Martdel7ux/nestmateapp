import { Link } from "react-router-dom";
import {
  Sparkles, Home, Wallet, Calendar, FileText, BookOpen, Compass,
  MapPin, Lock, AlertCircle, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HelpCategory } from "@/types/help";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Home, Wallet, Calendar, FileText, BookOpen, Compass,
  MapPin, Lock, AlertCircle, HelpCircle,
};

interface Props {
  category: HelpCategory;
}

export function CategoryCard({ category }: Props) {
  const Icon: LucideIcon = (category.icon ? (ICON_MAP[category.icon] ?? HelpCircle) : HelpCircle);

  return (
    <Link
      to={`/profile/help/category/${category.slug}`}
      className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition hover:bg-muted/40 active:scale-[0.97]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground leading-snug">{category.name}</p>
        {category.article_count !== undefined && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {category.article_count} article{category.article_count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
