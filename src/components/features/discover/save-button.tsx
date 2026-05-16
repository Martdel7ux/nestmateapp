import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleSave } from "@/hooks/use-saved-opportunities";
import { useAuth } from "@/contexts/auth-context";
import type { Opportunity } from "@/types/discover";

export function SaveButton({ opportunity }: { opportunity: Opportunity }) {
  const { user } = useAuth();
  const { mutate, isPending } = useToggleSave(opportunity.id, !!opportunity.is_saved);

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutate();
      }}
      disabled={isPending}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
        opportunity.is_saved
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      <Bookmark size={15} fill={opportunity.is_saved ? "currentColor" : "none"} />
    </button>
  );
}
