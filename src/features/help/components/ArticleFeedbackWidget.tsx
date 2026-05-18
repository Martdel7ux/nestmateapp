import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { submitArticleFeedback } from "@/features/help/api/help-api";
import { AskAIButton } from "@/features/help/components/AskAIButton";
import type { HelpArticle } from "@/types/help";

interface Props {
  article: HelpArticle;
}

export function ArticleFeedbackWidget({ article }: Props) {
  const [voted, setVoted]     = useState<"helpful" | "not_helpful" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function vote(wasHelpful: boolean) {
    if (voted) return;
    setVoted(wasHelpful ? "helpful" : "not_helpful");
    try {
      await submitArticleFeedback(article.id, wasHelpful);
    } catch {
      // best-effort
    }
    if (wasHelpful) setSubmitted(true);
  }

  async function submitComment() {
    try {
      await submitArticleFeedback(article.id, false, comment);
    } catch {
      // best-effort
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-foreground">Thanks for your feedback!</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Your input helps us improve our help articles.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-sm font-semibold text-foreground text-center mb-3">Was this article helpful?</p>

      {!voted && (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => vote(true)}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-900/20 active:scale-95"
          >
            <ThumbsUp size={15} /> Yes
          </button>
          <button
            type="button"
            onClick={() => vote(false)}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 dark:hover:bg-rose-900/20 active:scale-95"
          >
            <ThumbsDown size={15} /> No
          </button>
        </div>
      )}

      {voted === "not_helpful" && (
        <div className="mt-3 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What would have helped? (optional)"
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={submitComment}
              className="rounded-xl bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 transition"
            >
              Send feedback
            </button>
            <AskAIButton
              label="Ask Nestmate AI about this"
              prompt={`I have a question about: ${article.title}`}
              context={{ source: "help_article", source_article_id: article.id }}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
