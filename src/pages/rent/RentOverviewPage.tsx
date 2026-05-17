import { useNavigate } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useRentAgreements, useRentPayments } from "@/hooks/use-rent";
import { RentDueCard } from "@/components/features/rent/RentDueCard";
import { RentPaymentRow } from "@/components/features/rent/RentPaymentRow";

function AgreementSection({ agreementId, currency }: { agreementId: string; currency: string }) {
  const navigate = useNavigate();
  const { data: payments = [] } = useRentPayments(agreementId);
  const upcoming = payments.filter((p) => p.status !== "paid" && p.status !== "skipped").slice(0, 1);
  const history  = payments.filter((p) => p.status === "paid" || p.status === "late" || p.status === "skipped");

  return (
    <div className="space-y-2">
      {upcoming.map((p) => <RentDueCard key={p.id} payment={p} />)}
      {history.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">History</p>
          {history.map((p) => (
            <RentPaymentRow key={p.id} payment={p}
              onClick={() => navigate(`/rent/payments/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RentOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: agreements = [], isLoading } = useRentAgreements(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader title="Rent" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        title="Rent"
        right={{
          type: "custom",
          element: (
            <button type="button" onClick={() => navigate("/rent/new")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus size={16} />
            </button>
          ),
        }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {agreements.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
              <FileText size={36} className="text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground">No rent agreements yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Set up your rent once and get reminders before each due date.
              </p>
            </div>
            <button type="button" onClick={() => navigate("/rent/new")}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Set up Rent
            </button>
          </div>
        ) : (
          agreements.map((ag) => (
            <div key={ag.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {ag.landlord_name ?? "Rent agreement"}
                </p>
                <button type="button" onClick={() => navigate(`/rent/${ag.id}`)}
                  className="text-xs text-primary font-semibold">Settings</button>
              </div>
              <AgreementSection agreementId={ag.id} currency={ag.currency} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
