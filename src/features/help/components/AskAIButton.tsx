import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { logAiHandoff } from "@/features/help/api/help-api";
import { cn } from "@/lib/utils";
import type { AiHandoffContext } from "@/types/help";

interface Props {
  label?: string;
  prompt?: string;
  context?: Omit<AiHandoffContext, "query">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AskAIButton({
  label = "Ask Nestmate AI",
  prompt = "",
  context = { source: "help_landing" },
  size = "md",
  className,
}: Props) {
  const navigate = useNavigate();

  async function handleClick() {
    const params = new URLSearchParams({ source: "help" });
    if (prompt) params.set("prompt", prompt);
    if (context.source_article_id) params.set("article_id", context.source_article_id);

    // Log handoff (best-effort, don't block navigation)
    logAiHandoff({ query: prompt, ...context }).catch(() => undefined);

    navigate(`/assistant?${params}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-2xl font-semibold transition active:scale-[0.97]",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-5 py-3 text-base",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Sparkles size={size === "sm" ? 13 : size === "lg" ? 18 : 15} />
      {label}
    </button>
  );
}
