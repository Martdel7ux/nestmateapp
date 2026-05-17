import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CyprusArea } from "@/hooks/use-cyprus-areas";

const CITIES = ["nicosia", "limassol", "larnaca", "paphos", "famagusta", "other"] as const;

function useAllAreas() {
  return useQuery<CyprusArea[]>({
    queryKey: ["admin", "cyprusAreas"],
    queryFn: async () => {
      const { data, error } = await supabase!
        .from("cyprus_areas")
        .select("*")
        .order("city")
        .order("display_order");
      if (error) throw error;
      return data as CyprusArea[];
    },
  });
}

interface AreaRowProps {
  area: CyprusArea;
  onSave: (id: string, patch: Partial<CyprusArea>) => void;
  onDelete: (id: string) => void;
}

function AreaRow({ area, onSave, onDelete }: AreaRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(area.area_name);
  const [order, setOrder]     = useState(String(area.display_order));

  function handleSave() {
    onSave(area.id, { area_name: name, display_order: parseInt(order) || 100 });
    setEditing(false);
  }

  function handleCancel() {
    setName(area.area_name);
    setOrder(String(area.display_order));
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 flex-1 text-sm"
            autoFocus
          />
          <Input
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="h-8 w-16 text-sm"
            type="number"
            placeholder="Order"
          />
          <button type="button" onClick={handleSave} className="rounded-full p-1 text-emerald-600 hover:bg-emerald-50">
            <Check size={15} />
          </button>
          <button type="button" onClick={handleCancel} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{area.area_name}</span>
          <span className="text-xs text-muted-foreground w-10 text-right">{area.display_order}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${area.is_active ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
            {area.is_active ? "active" : "hidden"}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="rounded-full p-1 text-muted-foreground hover:bg-muted">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={() => onDelete(area.id)} className="rounded-full p-1 text-destructive/70 hover:bg-destructive/10">
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  );
}

export function CyprusAreasAdminTab() {
  const qc = useQueryClient();
  const { data: areas = [], isLoading } = useAllAreas();
  const [selectedCity, setSelectedCity] = useState<string>("nicosia");
  const [newName, setNewName]           = useState("");
  const [adding, setAdding]             = useState(false);

  const filtered = areas.filter((a) => a.city === selectedCity);

  const upsert = useMutation({
    mutationFn: async (payload: Partial<CyprusArea> & { id?: string }) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase!.from("cyprus_areas").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase!.from("cyprus_areas").insert({ city: selectedCity, ...rest });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cyprusAreas"] });
      qc.invalidateQueries({ queryKey: ["cyprusAreas"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase!.from("cyprus_areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "cyprusAreas"] });
      qc.invalidateQueries({ queryKey: ["cyprusAreas"] });
      toast.success("Area deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  async function handleAdd() {
    if (!newName.trim()) return;
    await upsert.mutateAsync({ area_name: newName.trim(), display_order: 100, is_active: true });
    setNewName("");
    setAdding(false);
    toast.success("Area added");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Cyprus Areas</h2>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5">
          <Plus size={14} /> Add area
        </Button>
      </div>

      {/* City picker */}
      <div className="flex gap-2 flex-wrap">
        {CITIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCity(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              selectedCity === c
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Add area form */}
      {adding && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Area name"
            className="h-8 flex-1 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
          />
          <Button size="sm" onClick={handleAdd} disabled={upsert.isPending}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(""); }}>Cancel</Button>
        </div>
      )}

      {/* Area list */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No areas for {selectedCity} yet.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AreaRow
              key={a.id}
              area={a}
              onSave={(id, patch) => upsert.mutate({ id, ...patch })}
              onDelete={(id) => del.mutate(id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} area{filtered.length !== 1 ? "s" : ""} in {selectedCity}
      </p>
    </div>
  );
}
