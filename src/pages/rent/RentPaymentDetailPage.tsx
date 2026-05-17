import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useRentPayment, useMarkRentPaid } from "@/hooks/use-rent";
import { LandlordContactBlock } from "@/components/features/rent/LandlordContactBlock";
import { PaymentDetailsBlock } from "@/components/features/rent/PaymentDetailsBlock";
import { cn } from "@/lib/utils";
import type { RentPaymentStatus } from "@/types/rent";

function StatusBanner({ status, dueDate }: { status: RentPaymentStatus; dueDate: string }) {
  const due   = new Date(dueDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days  = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (status === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4">
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Paid</span>
      </div>
    );
  }
  if (status === "late" || days < 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-4">
        <AlertCircle size={18} className="text-rose-500 shrink-0" />
        <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
          Overdue by {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }
  const label = days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days} days`;
  return (
    <div className={cn("flex items-center gap-2 rounded-2xl p-4",
      days <= 1 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-primary/5"
    )}>
      <Clock size={18} className={days <= 1 ? "text-amber-500 shrink-0" : "text-primary shrink-0"} />
      <span className={cn("text-sm font-semibold", days <= 1 ? "text-amber-700 dark:text-amber-400" : "text-primary")}>
        {label}
      </span>
    </div>
  );
}

export function RentPaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { user } = useAuth();
  const { data: payment, isLoading } = useRentPayment(paymentId);
  const { mutateAsync: markPaid, isPending } = useMarkRentPaid(paymentId!, user?.id ?? "");

  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paidAt, setPaidAt]             = useState(new Date().toISOString().slice(0, 10));
  const [paidMethod, setPaidMethod]     = useState("");
  const [notes, setNotes]               = useState("");

  async function handleMarkPaid() {
    if (!payment) return;
    try {
      await markPaid({ payment, form: { paid_at: paidAt, paid_method: paidMethod || undefined, notes: notes || undefined } });
      toast.success("Marked as paid!");
      setShowMarkPaid(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading || !payment) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Rent Payment" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const ag = payment.rent_agreements;
  const dueLabel = new Date(payment.due_date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const isPaid = payment.status === "paid";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Rent Payment" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <StatusBanner status={payment.status} dueDate={payment.due_date} />

        {/* Amount */}
        <div className="text-center py-4">
          <p className="text-5xl font-bold text-foreground">€{Number(payment.amount).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2">{dueLabel}</p>
        </div>

        {/* Landlord */}
        <LandlordContactBlock
          name={ag?.landlord_name}
          phone={ag?.landlord_phone}
          email={ag?.landlord_email}
          whatsapp={ag?.landlord_whatsapp}
        />

        {/* Payment details */}
        <PaymentDetailsBlock
          method={ag?.payment_method}
          details={ag?.payment_details}
        />

        {/* Mark as paid */}
        {!isPaid && !showMarkPaid && (
          <button type="button" onClick={() => setShowMarkPaid(true)}
            className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-sm active:scale-[0.97] transition-transform">
            Mark as Paid
          </button>
        )}

        {!isPaid && showMarkPaid && (
          <div className="rounded-2xl border border-border p-4 space-y-4">
            <p className="font-semibold text-foreground">Confirm payment</p>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Date paid</label>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Method (optional)</label>
              <input type="text" value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)}
                placeholder="e.g. Bank transfer"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Note (optional)</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sent via Revolut"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowMarkPaid(false)}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground">
                Cancel
              </button>
              <button type="button" onClick={handleMarkPaid} disabled={isPending}
                className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
                {isPending ? "Saving…" : "Confirm Paid"}
              </button>
            </div>
          </div>
        )}

        {isPaid && payment.paid_at && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment confirmed</p>
            <p className="text-sm text-foreground">
              {new Date(payment.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {payment.paid_method && ` · ${payment.paid_method}`}
            </p>
            {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
