import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useCreateRentAgreement } from "@/hooks/use-rent";
import { useHouseholds } from "@/hooks/use-household";
import { RentAgreementForm } from "@/components/features/rent/RentAgreementForm";

export function RentNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutateAsync, isPending } = useCreateRentAgreement(user?.id ?? "");
  const { data: households = [] } = useHouseholds(user?.id);

  async function handleSubmit(form: Parameters<typeof mutateAsync>[0]) {
    try {
      await mutateAsync(form);
      toast.success("Rent agreement saved! Reminders are set up.");
      navigate("/rent");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Set Up Rent" />
      <RentAgreementForm
        userId={user?.id ?? ""}
        households={households}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  );
}
