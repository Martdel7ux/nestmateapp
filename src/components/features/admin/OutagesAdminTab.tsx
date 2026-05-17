import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useOutages, useCreateOutage, useDeleteOutage } from "@/hooks/use-tools";
import type { CyprusDistrict } from "@/types/tools";

const inputCls  = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
const labelCls  = "block text-xs font-semibold text-muted-foreground mb-1";

const DISTRICTS: CyprusDistrict[] = ["nicosia","limassol","larnaca","paphos","famagusta"];

const EMPTY = {
  starts_at: "", ends_at: "",
  district: "nicosia" as CyprusDistrict,
  area: "", streets: "", reason: "", source_url: "",
};

export function OutagesAdminTab() {
  const { data: outages = [], isLoading } = useOutages();
  const { mutateAsync: create, isPending: creating } = useCreateOutage();
  const { mutateAsync: remove } = useDeleteOutage();

  const [form,     setForm]     = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  function set(key: keyof typeof EMPTY, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleCreate() {
    if (!form.starts_at || !form.ends_at || !form.area) {
      toast.error("Start, end, and area are required.");
      return;
    }
    try {
      await create({
        starts_at:  new Date(form.starts_at).toISOString(),
        ends_at:    new Date(form.ends_at).toISOString(),
        district:   form.district,
        area:       form.area || null,
        streets:    form.streets.split(",").map((s) => s.trim()).filter(Boolean),
        reason:     form.reason || null,
        source_url: form.source_url || null,
        source_id:  null,
        raw_text:   null,
      });
      toast.success("Outage created.");
      setForm(EMPTY);
      setShowForm(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this outage?")) return;
    try {
      await remove(id);
      toast.success("Deleted.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">EAC Outages</h2>
        <button type="button" onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          <Plus size={14} /> Add outage
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Starts at *</label>
              <input type="datetime-local" value={form.starts_at}
                onChange={(e) => set("starts_at", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ends at *</label>
              <input type="datetime-local" value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>District</label>
              <select value={form.district}
                onChange={(e) => set("district", e.target.value)} className={inputCls}>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Area *</label>
              <input type="text" value={form.area} placeholder="e.g. Strovolos"
                onChange={(e) => set("area", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Streets (comma-separated)</label>
            <input type="text" value={form.streets}
              placeholder="Archiepiskopou Makariou, Athalassas Ave"
              onChange={(e) => set("streets", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <input type="text" value={form.reason}
              placeholder="Scheduled maintenance"
              onChange={(e) => set("reason", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Source URL</label>
            <input type="url" value={form.source_url}
              onChange={(e) => set("source_url", e.target.value)} className={inputCls} />
          </div>
          <button type="button" onClick={handleCreate} disabled={creating}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {creating ? "Saving…" : "Save Outage"}
          </button>
        </div>
      )}

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      <div className="space-y-2">
        {outages.map((o) => (
          <div key={o.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-semibold text-foreground capitalize">
                {o.area ?? o.district} · {new Date(o.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs text-muted-foreground">{o.streets.slice(0, 3).join(", ")}{o.streets.length > 3 ? "…" : ""}</p>
            </div>
            <button type="button" onClick={() => handleDelete(o.id)}
              className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/5 p-1.5 text-destructive">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {!isLoading && outages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No outages. Add one above or wait for the daily scraper.</p>
        )}
      </div>
    </div>
  );
}
