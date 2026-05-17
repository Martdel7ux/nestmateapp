import { useNavigate } from "react-router-dom";
import { Home, Plus, LogIn } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";

export function HouseholdLandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader title="Household" />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <Home size={36} className="text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">Split bills, stay friends</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Track shared expenses with your housemates and settle up fairly.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => navigate("/household/new")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm active:scale-[0.97] transition-transform"
          >
            <Plus size={18} />
            Create a Household
          </button>
          <button
            type="button"
            onClick={() => navigate("/household/join")}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-3.5 font-semibold text-foreground active:scale-[0.97] transition-transform"
          >
            <LogIn size={18} />
            Join with Invite Code
          </button>
        </div>
      </div>
    </div>
  );
}
