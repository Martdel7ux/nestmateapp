import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useRentAgreement, useUpdateRentAgreement, useDeactivateRentAgreement } from "@/hooks/use-rent";
import { useHouseholds } from "@/hooks/use-household";
import { RentAgreementForm } from "@/components/features/rent/RentAgreementForm";

export function RentAgreementDetailPage() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: agreement, isLoading } = useRentAgreement(agreementId);
  const { mutateAsync: update, isPending } = useUpdateRentAgreement(agreementId!, user?.id ?? "");
  const { mutateAsync: deactivate } = useDeactivateRentAgreement(user?.id ?? "");
  const { data: households = [] } = useHouseholds(user?.id);

  async function handleSubmit(form: Parameters<typeof update>[0]) {
    try {
      await update(form);
      toast.success("Agreement updated.");
      navigate("/rent");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDeactivate() {
    if (!agreementId) return;
    if (!confirm("End this rent agreement? Future reminders will stop.")) return;
    try {
      await deactivate(agreementId);
      toast.success("Rent agreement ended.");
      navigate("/rent");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading || !agreement) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Rent Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const initial = {
    amount:                       String(agreement.amount),
    currency:                     agreement.currency,
    due_day:                      String(agreement.due_day),
    first_payment_date:           agreement.first_payment_date,
    open_ended:                   !agreement.end_date,
    end_date:                     agreement.end_date ?? "",
    scope:                        agreement.scope,
    household_id:                 agreement.household_id ?? "",
    landlord_name:                agreement.landlord_name ?? "",
    landlord_phone:               agreement.landlord_phone ?? "",
    landlord_email:               agreement.landlord_email ?? "",
    landlord_whatsapp:            agreement.landlord_whatsapp ?? "",
    payment_method:               agreement.payment_method ?? undefined,
    payment_details:              agreement.payment_details ?? "",
    reminder_days_before:         agreement.reminder_days_before,
    reminder_followup_on_due_day: agreement.reminder_followup_on_due_day,
    reminder_channels:            agreement.reminder_channels,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Rent Settings" />
      <RentAgreementForm
        initial={initial}
        userId={user?.id ?? ""}
        households={households}
        onSubmit={handleSubmit}
        isPending={isPending}
        footer={
          <button type="button" onClick={handleDeactivate}
            className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive">
            End this agreement
          </button>
        }
      />
    </div>
  );
}
