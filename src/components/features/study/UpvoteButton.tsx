import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToggleUpvote } from "@/hooks/use-notes";

interface Props {
  noteId: string;
  count: number;
  isUpvoted: boolean;
  disabled?: boolean;
}

export function UpvoteButton({ noteId, count, isUpvoted, disabled }: Props) {
  const { mutate: toggle, isPending } = useToggleUpvote();

  const handleClick = () => {
    if (disabled || isPending) return;
    toggle({ noteId, currentlyUpvoted: isUpvoted });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
        isUpvoted
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
        (disabled || isPending) && "opacity-50 cursor-not-allowed"
      )}
    >
      <ThumbsUp
        size={15}
        className={cn("transition-transform", isUpvoted && "scale-110")}
        fill={isUpvoted ? "currentColor" : "none"}
      />
      <span>{count}</span>
    </button>
  );
}
