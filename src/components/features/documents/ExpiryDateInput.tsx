import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

export function ExpiryDateInput({ label = "Expiry date", value, onChange, className }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <input
        type="date"
        value={value}
        min={today}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, value && new Date(value) < new Date() ? "border-rose-400 focus:ring-rose-400/40" : "")}
      />
      {value && new Date(value) < new Date() && (
        <p className="mt-1 text-xs text-rose-500">This date is in the past — document may already be expired.</p>
      )}
    </div>
  );
}
