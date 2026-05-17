import { cn } from "@/lib/utils";
import type { DocumentCategory } from "@/types/document";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/document";

interface Props {
  category: DocumentCategory;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "md" }: Props) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      CATEGORY_COLORS[category]
    )}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
