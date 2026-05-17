import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { RentPaymentMethod } from "@/types/rent";

const METHOD_LABEL: Record<RentPaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  revolut:       "Revolut",
  cash:          "Cash",
  cheque:        "Cheque",
  other:         "Other",
};

interface Props {
  method?: RentPaymentMethod | null;
  details?: string | null;
}

export function PaymentDetailsBlock({ method, details }: Props) {
  const [copied, setCopied] = useState(false);

  if (!method && !details) return null;

  async function copy() {
    if (!details) return;
    await navigator.clipboard.writeText(details);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-background/70 dark:bg-slate-800/60 p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Payment Method
      </p>
      {method && <p className="text-sm font-semibold text-foreground">{METHOD_LABEL[method]}</p>}
      {details && (
        <div className="flex items-center gap-2">
          <p className="flex-1 font-mono text-sm text-foreground break-all">{details}</p>
          <button
            type="button"
            onClick={copy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
