import type { RentPayment, RentPaymentStatus } from "@/types/rent";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RentPaymentStatus, string> = {
  upcoming:   "Upcoming",
  reminded:   "Reminded",
  due_today:  "Due Today",
  paid:       "Paid",
  late:       "Late",
  skipped:    "Skipped",
};

const STATUS_COLOR: Record<RentPaymentStatus, string> = {
  upcoming:   "bg-muted text-muted-foreground",
  reminded:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  due_today:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  late:       "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  skipped:    "bg-muted text-muted-foreground",
};

interface Props {
  payment: RentPayment;
  onClick?: () => void;
}

export function RentPaymentRow({ payment, onClick }: Props) {
  const dueLabel = new Date(payment.due_date).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const amount   = `€${Number(payment.amount).toFixed(2)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-background/70 dark:bg-slate-800/60 p-3.5 text-left active:scale-[0.98] transition-transform"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{dueLabel}</p>
        {payment.paid_at && (
          <p className="text-xs text-muted-foreground">
            Paid {new Date(payment.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-bold text-foreground">{amount}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_COLOR[payment.status])}>
          {STATUS_LABEL[payment.status]}
        </span>
      </div>
    </button>
  );
}
