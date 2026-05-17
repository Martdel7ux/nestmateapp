import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  code: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export function InviteCodeDisplay({ code, onRegenerate, regenerating }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-primary/10 dark:bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invite Code</p>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            New code
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex-1 font-mono text-2xl font-bold tracking-widest text-foreground">{code}</span>
        <button
          type="button"
          onClick={copy}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-80 active:scale-95"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Share this code with housemates to invite them.</p>
    </div>
  );
}
