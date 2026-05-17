import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHousehold, useHouseholdMembers, useAddSettlement } from "@/hooks/use-household";
import { getMemberName } from "@/lib/household-utils";
import type { SettlementMethod } from "@/types/household";

const METHODS: { value: SettlementMethod; label: string }[] = [
  { value: "cash",          label: "Cash" },
  { value: "revolut",       label: "Revolut" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other",         label: "Other" },
];

export function SettlementNewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: household } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { mutateAsync, isPending } = useAddSettlement(id!);

  const prefill = location.state as { from_user_id?: string; to_user_id?: string; amount?: string } | null;

  const [fromUser, setFromUser] = useState(prefill?.from_user_id ?? user?.id ?? "");
  const [toUser, setToUser] = useState(prefill?.to_user_id ?? "");
  const [amount, setAmount] = useState(prefill?.amount ?? "");
  const [method, setMethod] = useState<SettlementMethod>("cash");
  const [note, setNote] = useState("");
  const [settledAt, setSettledAt] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id) return;
    if (!amount || !fromUser || !toUser) return toast.error("Fill in all required fields.");
    if (fromUser === toUser) return toast.error("From and To must be different people.");
    try {
      await mutateAsync({
        form: { from_user_id: fromUser, to_user_id: toUser, amount, method, note: note.trim() || undefined, settled_at: settledAt },
        userId: user.id,
      });
      toast.success("Settlement recorded!");
      navigate(`/household/${id}/settle`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Record Payment" />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">From</label>
          <select value={fromUser} onChange={(e) => setFromUser(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{getMemberName(m)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">To</label>
          <select value={toUser} onChange={(e) => setToUser(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">— Select —</option>
            {members.filter((m) => m.user_id !== fromUser).map((m) => (
              <option key={m.user_id} value={m.user_id}>{getMemberName(m)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {household?.currency === "EUR" ? "€" : household?.currency ?? "€"}
            </span>
            <input required type="number" min="0.01" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full rounded-2xl border border-border bg-background pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Method</label>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setMethod(value)}
                className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${method === value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Date</label>
          <input type="date" value={settledAt} onChange={(e) => setSettledAt(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Sent via Revolut"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        <button type="submit" disabled={isPending}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.97] transition-transform">
          {isPending ? "Saving…" : "Record Payment"}
        </button>
      </form>
    </div>
  );
}
