import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useAuth } from "@/contexts/auth-context";
import { useHousehold, useHouseholdMembers, useAddExpense } from "@/hooks/use-household";
import { CategoryPicker } from "@/components/features/household/CategoryPicker";
import { SplitInputs } from "@/components/features/household/SplitInputs";
import { getMemberName } from "@/lib/household-utils";
import type { SplitMethod, ExpenseCategory } from "@/types/household";
import { cn } from "@/lib/utils";

const SPLIT_METHODS: { value: SplitMethod; label: string }[] = [
  { value: "equal",  label: "Equal" },
  { value: "shares", label: "By Shares" },
  { value: "custom", label: "Custom" },
];

export function ExpenseNewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: household } = useHousehold(id);
  const { data: members = [] } = useHouseholdMembers(id);
  const { mutateAsync, isPending } = useAddExpense(id!);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(user?.id ?? "");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [category, setCategory] = useState<ExpenseCategory | undefined>();
  const [notes, setNotes] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>(members.map((m) => m.user_id));
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [shareWeights, setShareWeights] = useState<Record<string, string>>({});

  // sync participants when members load
  const allMemberIds = members.map((m) => m.user_id);
  const syncedParticipants = participantIds.length === 0 && allMemberIds.length > 0
    ? allMemberIds
    : participantIds;

  function toggleParticipant(uid: string) {
    setParticipantIds((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id) return;
    if (!description.trim() || !amount) return toast.error("Description and amount are required.");
    if (syncedParticipants.length === 0) return toast.error("Select at least one participant.");
    try {
      await mutateAsync({
        form: {
          description: description.trim(),
          amount,
          paid_by: paidBy,
          paid_at: paidAt,
          split_method: splitMethod,
          category,
          notes: notes.trim() || undefined,
          participant_ids: syncedParticipants,
          custom_shares: customShares,
          share_weights: shareWeights,
        },
        userId: user.id,
      });
      toast.success("Expense added!");
      navigate(`/household/${id}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="New Expense" />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description *</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Amount *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {household?.currency === "EUR" ? "€" : household?.currency ?? "€"}
            </span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-border bg-background pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{getMemberName(m)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Date</label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Category</label>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Split Method</label>
          <div className="flex gap-2">
            {SPLIT_METHODS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSplitMethod(value)}
                className={cn(
                  "flex-1 rounded-2xl py-2.5 text-xs font-semibold border transition-all",
                  splitMethod === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Participants</label>
          <SplitInputs
            method={splitMethod}
            members={members}
            participantIds={syncedParticipants}
            onToggleParticipant={toggleParticipant}
            customShares={customShares}
            onCustomShare={(uid, val) => setCustomShares((prev) => ({ ...prev, [uid]: val }))}
            shareWeights={shareWeights}
            onShareWeight={(uid, val) => setShareWeights((prev) => ({ ...prev, [uid]: val }))}
            total={amount}
            currency={household?.currency}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any extra details…"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.97] transition-transform"
        >
          {isPending ? "Saving…" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
