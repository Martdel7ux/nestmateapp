import { useNavigate } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useRentAgreements, useRentPayments } from "@/hooks/use-rent";
import { RentDueCard } from "@/components/features/rent/RentDueCard";
import { RentPaymentRow } from "@/components/features/rent/RentPaymentRow";
import { useI18n } from "@/contexts/i18n-context";

function AgreementSection({ agreementId, currency }: { agreementId: string; currency: string }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data: payments = [] } = useRentPayments(agreementId);
  const upcoming = payments.filter((p) => p.status !== "paid" && p.status !== "skipped").slice(0, 1);
  const history  = payments.filter((p) => p.status === "paid" || p.status === "late" || p.status === "skipped");

  return (
    <div className="space-y-2">
      {upcoming.map((p) => <RentDueCard key={p.id} payment={p} />)}
      {history.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">{t("rentHistory")}</p>
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
  const { t } = useI18n();
  const { data: agreements = [], isLoading } = useRentAgreements(user?.id);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader title={t("rentTitle")} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        title={t("rentTitle")}
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
              <p className="font-bold text-foreground">{t("rentNoAgreements")}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("rentSetupDesc")}
              </p>
            </div>
            <button type="button" onClick={() => navigate("/rent/new")}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              {t("rentSetUp")}
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
                  className="text-xs text-primary font-semibold">{t("rentSettings")}</button>
              </div>
              <AgreementSection agreementId={ag.id} currency={ag.currency} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
