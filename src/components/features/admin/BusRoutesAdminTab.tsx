import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useAllBusRoutes, useCreateBusRoute, useUpdateBusRoute, useDeleteBusRoute } from "@/hooks/use-tools";
import type { UniversityKey } from "@/types/tools";

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

const UNIVERSITIES: UniversityKey[] = ["unic","ucy","cut","euc"];

const EMPTY = {
  route_code: "", route_name: "", university: "unic" as UniversityKey,
  operator: "", start_point: "", end_point: "",
  typical_frequency: "", first_departure: "", last_departure: "",
  fare_eur: "", notes: "", source_url: "",
};

export function BusRoutesAdminTab() {
  const { data: routes = [], isLoading } = useAllBusRoutes();
  const { mutateAsync: create, isPending: creating } = useCreateBusRoute();
  const { mutateAsync: update } = useUpdateBusRoute();
  const { mutateAsync: remove } = useDeleteBusRoute();

  const [form,     setForm]     = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [filterUni, setFilterUni] = useState<UniversityKey | "all">("all");

  function set(key: keyof typeof EMPTY, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleCreate() {
    if (!form.route_code || !form.route_name) {
      toast.error("Route code and name are required.");
      return;
    }
    try {
      await create({
        route_code: form.route_code,
        route_name: form.route_name,
        university: form.university,
        operator: form.operator || null,
        start_point: form.start_point || null,
        end_point: form.end_point || null,
        typical_frequency: form.typical_frequency || null,
        first_departure: form.first_departure || null,
        last_departure: form.last_departure || null,
        fare_eur: form.fare_eur ? parseFloat(form.fare_eur) : null,
        notes: form.notes || null,
        source_url: form.source_url || null,
        is_active: true,
        display_order: 100,
      });
      toast.success("Route created.");
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const filtered = filterUni === "all" ? routes : routes.filter((r) => r.university === filterUni);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Bus Routes</h2>
        <button type="button" onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          <Plus size={14} /> Add route
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {(["all", ...UNIVERSITIES] as const).map((u) => (
          <button key={u} type="button" onClick={() => setFilterUni(u as typeof filterUni)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${filterUni === u ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}>
            {u === "all" ? "All" : u.toUpperCase()}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Route code *</label>
              <input type="text" value={form.route_code} placeholder="127"
                onChange={(e) => set("route_code", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>University</label>
              <select value={form.university}
                onChange={(e) => set("university", e.target.value)} className={inputCls}>
                {UNIVERSITIES.map((u) => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Route name *</label>
            <input type="text" value={form.route_name}
              placeholder="City Center → UNIC (Makedonitissa)"
              onChange={(e) => set("route_name", e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Operator</label>
              <input type="text" value={form.operator} placeholder="OSY"
                onChange={(e) => set("operator", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Fare (€)</label>
              <input type="number" step="0.01" value={form.fare_eur}
                onChange={(e) => set("fare_eur", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First departure</label>
              <input type="text" value={form.first_departure} placeholder="06:30"
                onChange={(e) => set("first_departure", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last departure</label>
              <input type="text" value={form.last_departure} placeholder="22:00"
                onChange={(e) => set("last_departure", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Frequency</label>
            <input type="text" value={form.typical_frequency}
              placeholder="Every 30 min weekdays"
              onChange={(e) => set("typical_frequency", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Source URL</label>
            <input type="url" value={form.source_url}
              onChange={(e) => set("source_url", e.target.value)} className={inputCls} />
          </div>
          <button type="button" onClick={handleCreate} disabled={creating}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {creating ? "Saving…" : "Save Route"}
          </button>
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{r.route_code}</span>
                <span className="text-xs uppercase text-muted-foreground">{r.university}</span>
              </div>
              <p className="text-sm font-semibold text-foreground truncate mt-0.5">{r.route_name}</p>
              {r.typical_frequency && <p className="text-xs text-muted-foreground">{r.typical_frequency}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button type="button"
                onClick={() => update({ id: r.id, patch: { is_active: !r.is_active } })}
                className="text-muted-foreground">
                {r.is_active
                  ? <ToggleRight size={18} className="text-primary" />
                  : <ToggleLeft size={18} />
                }
              </button>
              <button type="button" onClick={() => { if (confirm("Delete?")) remove(r.id); }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No routes found.</p>
        )}
      </div>
    </div>
  );
}
