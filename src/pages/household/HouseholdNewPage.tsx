import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useCreateHousehold } from "@/hooks/use-household";
import { useI18n } from "@/contexts/i18n-context";

export function HouseholdNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { mutateAsync, isPending } = useCreateHousehold();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    try {
      const hh = await mutateAsync({ name: name.trim(), address: address.trim() || undefined, userId: user.id });
      toast.success(t("householdCreated"));
      navigate(`/household/${hh.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("householdCreateTitle")} />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">{t("householdNameLabel")}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("householdNamePh")}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">{t("householdAddressLabel")}</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("householdAddressPh")}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            {isPending ? t("householdCreating") : t("householdCreateBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
