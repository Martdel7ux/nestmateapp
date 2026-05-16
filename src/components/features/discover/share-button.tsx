import { Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Opportunity } from "@/types/discover";

export function ShareButton({ opportunity }: { opportunity: Opportunity }) {
  const handleShare = async () => {
    const shareData = {
      title: opportunity.title,
      text: opportunity.organization
        ? `${opportunity.title} at ${opportunity.organization}`
        : opportunity.title,
      url: opportunity.url ?? window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user dismissed
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <Share2 size={18} />
    </button>
  );
}
