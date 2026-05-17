import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useAllGarbageSchedules, useUpsertGarbageSchedule, useDeleteGarbageSchedule } from "@/hooks/use-tools";
import type { GarbageSchedule } from "@/types/tools";

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

const CITIES = ["nicosia", "limassol", "larnaca", "paphos"];

const EMPTY = {
  city: "nicosia", area: "",
  general_waste_days: "", recycling_days: "", organic_days: "",
  bulky_waste_info: "", notes: "",
};

function parseDays(s: string): number[] {
  return s.split(",").map((n) => parseInt(n.trim())).filter((n) => !isNaN(n) && n >= 0 && n <= 6);
}

function fmtDays(days: number[]): string {
  return days.join(", ");
}

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function GarbageAdminTab() {
  const { data: schedules = [], isLoading } = useAllGarbageSchedules();
  const { mutateAsync: upsert, isPending: saving } = useUpsertGarbageSchedule();
  const { mutateAsync: remove } = useDeleteGarbageSchedule();

  const [form,      setForm]      = useState(EMPTY);
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState("all");

  function set(key: keyof typeof EMPTY, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function startEdit(s: GarbageSchedule) {
    setEditingId(s.id);
    setForm({
      city: s.city,
      area: s.area,
      general_waste_days: fmtDays(s.general_waste_days),
      recycling_days:     fmtDays(s.recycling_days),
      organic_days:       fmtDays(s.organic_days),
      bulky_waste_info:   s.bulky_waste_info ?? "",
      notes:              s.notes ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.city || !form.area) { toast.error("City and area are required."); return; }
    try {
      await upsert({
        city: form.city,
        area: form.area,
        general_waste_days: parseDays(form.general_waste_days),
        recycling_days:     parseDays(form.recycling_days),
        organic_days:       parseDays(form.organic_days),
        bulky_waste_info:   form.bulky_waste_info || null,
        notes:              form.notes || null,
        source_url:         null,
      });
      toast.success("Schedule saved.");
      setForm(EMPTY);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const filtered = filterCity === "all" ? schedules : schedules.filter((s) => s.city === filterCity);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Garbage Schedules</h2>
        <button type="button" onClick={() => { setShowForm((s) => !s); setEditingId(null); setForm(EMPTY); }}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {(["all", ...CITIES] as const).map((c) => (
          <button key={c} type="button" onClick={() => setFilterCity(c)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold border transition-all capitalize ${filterCity === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">{editingId ? "Edit schedule" : "New schedule"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City *</label>
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Area *</label>
              <input type="text" value={form.area} placeholder="Strovolos"
                onChange={(e) => set("area", e.target.value)} className={inputCls} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat (comma-separated)</p>
          <div>
            <label className={labelCls}>General waste days</label>
            <input type="text" value={form.general_waste_days} placeholder="1, 4"
              onChange={(e) => set("general_waste_days", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Recycling days</label>
            <input type="text" value={form.recycling_days} placeholder="2"
              onChange={(e) => set("recycling_days", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Organic days</label>
            <input type="text" value={form.organic_days} placeholder="3"
              onChange={(e) => set("organic_days", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Bulky waste info</label>
            <input type="text" value={form.bulky_waste_info} placeholder="Call 22-403-000 for appointment"
              onChange={(e) => set("bulky_waste_info", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={form.notes}
              onChange={(e) => set("notes", e.target.value)} className={inputCls} />
          </div>
          <button type="button" onClick={handleSave} disabled={saving}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="space-y-2">
        {filtered.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.area}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.city}</p>
              <p className="text-xs text-muted-foreground">
                General: {s.general_waste_days.map((d) => DAY_NAMES[d]).join(", ") || "—"}
                {s.recycling_days.length > 0 && ` · Recycling: ${s.recycling_days.map((d) => DAY_NAMES[d]).join(", ")}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => startEdit(s)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground">
                <Pencil size={13} />
              </button>
              <button type="button" onClick={() => { if (confirm("Delete?")) remove(s.id); }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No schedules found.</p>
        )}
      </div>
    </div>
  );
}
