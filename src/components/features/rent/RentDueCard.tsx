import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { RentPayment } from "@/types/rent";
import { cn } from "@/lib/utils";

interface Props {
  payment: RentPayment;
}

function daysUntil(dateStr: string) {
  const due   = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function countdown(days: number): { label: string; urgent: boolean; overdue: boolean } {
  if (days < 0)  return { label: `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`, urgent: true,  overdue: true };
  if (days === 0) return { label: "Due today",                   urgent: true,  overdue: false };
  if (days === 1) return { label: "Due tomorrow",                urgent: true,  overdue: false };
  if (days <= 7)  return { label: `Due in ${days} days`,         urgent: false, overdue: false };
  return          { label: `Due in ${days} days`,                urgent: false, overdue: false };
}

export function RentDueCard({ payment }: Props) {
  const navigate = useNavigate();
  const days = daysUntil(payment.due_date);
  const { label, urgent, overdue } = countdown(days);
  const dueLabel = new Date(payment.due_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  const amount = `€${Number(payment.amount).toFixed(2)}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/rent/payments/${payment.id}`)}
      className={cn(
        "w-full rounded-3xl p-5 text-left shadow-sm active:scale-[0.98] transition-transform space-y-3",
        overdue ? "bg-rose-50 dark:bg-rose-900/20" : urgent ? "bg-amber-50 dark:bg-amber-900/20" : "bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2">
        {overdue ? (
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
        ) : urgent ? (
          <Clock size={16} className="text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 size={16} className="text-primary shrink-0" />
        )}
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          overdue ? "text-rose-500" : urgent ? "text-amber-600" : "text-primary"
        )}>{label}</span>
      </div>

      <div>
        <p className="text-3xl font-bold text-foreground">{amount}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{dueLabel}</p>
      </div>

      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        overdue ? "bg-rose-500 text-white" : urgent ? "bg-amber-500 text-white" : "bg-primary text-primary-foreground"
      )}>
        View &amp; manage →
      </div>
    </button>
  );
}
