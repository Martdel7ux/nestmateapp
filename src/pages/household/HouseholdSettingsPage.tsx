import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppHeader } from "@/components/layout/app-header";
import { useHousehold, useUpdateHousehold } from "@/hooks/use-household";

export function HouseholdSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: household, isLoading } = useHousehold(id);
  const { mutateAsync, isPending } = useUpdateHousehold(id!);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (household) {
      setName(household.name);
      setAddress(household.address ?? "");
    }
  }, [household]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await mutateAsync({ name: name.trim(), address: address.trim() || undefined });
      toast.success("Settings saved!");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppHeader variant="sub-page" title="Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Household Settings" />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Optional"
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.97] transition-transform">
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
