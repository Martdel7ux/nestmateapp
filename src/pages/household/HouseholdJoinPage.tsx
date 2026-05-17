import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useJoinHousehold } from "@/hooks/use-household";

export function HouseholdJoinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutateAsync, isPending } = useJoinHousehold();
  const [code, setCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !user) return;
    try {
      const hh = await mutateAsync({ code: code.trim(), userId: user.id });
      toast.success(`Joined ${hh.name}!`);
      navigate(`/household/${hh.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Join a Household" />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-sm text-muted-foreground">Ask a housemate to share their invite code (format: NEST-XXXX).</p>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Invite Code</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="NEST-XXXX"
            maxLength={9}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || !code.trim()}
            className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.97] transition-transform"
          >
            {isPending ? "Joining…" : "Join Household"}
          </button>
        </div>
      </form>
    </div>
  );
}
