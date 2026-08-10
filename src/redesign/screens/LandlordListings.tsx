import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useMyProperties, propertyStatus, STATUS_STYLE, type MyProperty } from "@/hooks/use-my-properties";
import { ModuleIcon } from "../icons";
import { PropertyForm } from "./PropertyForm";

type FormState = null | "add" | MyProperty;

export function LandlordListings({ addToken = 0 }: { addToken?: number }) {
  const { user } = useAuth();
  const { togglePropertyVisibility, deleteProperty } = useData();
  const { data, isLoading } = useMyProperties(user?.id);
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => { if (addToken) setForm("add"); }, [addToken]);

  const list = data ?? [];
  const refetch = () => qc.invalidateQueries({ queryKey: ["my-properties"] });

  if (form) {
    return <PropertyForm existing={form === "add" ? null : form} onBack={() => setForm(null)} onDone={() => { setForm(null); refetch(); }} />;
  }

  const patchCache = (id: string, patch: Partial<MyProperty>) =>
    qc.setQueryData<MyProperty[]>(["my-properties", user?.id], (cur) => cur?.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const toggleVisible = (p: MyProperty) => {
    patchCache(p.id, { is_visible: !p.is_visible });
    togglePropertyVisibility(p.id);
    setTimeout(refetch, 800);
  };
  const remove = (p: MyProperty) => {
    setConfirmId(null);
    qc.setQueryData<MyProperty[]>(["my-properties", user?.id], (cur) => cur?.filter((x) => x.id !== p.id));
    deleteProperty(p.id);
    setTimeout(refetch, 800);
  };

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Listings</div>
          <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 6 }}>{list.length} propert{list.length === 1 ? "y" : "ies"}</div>
        </div>
        <button type="button" onClick={() => setForm("add")} className="nm-press" style={{ all: "unset", cursor: "pointer", flex: "none", padding: "10px 15px", borderRadius: 99, background: "var(--nm-accent)", color: "#fff", font: "600 13px var(--nm-font-text)" }}>＋ Add</button>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 24, textAlign: "center", color: "var(--nm-muted)", fontSize: 13 }}>Loading…</div>
      ) : list.length === 0 ? (
        <div className="nm-card nm-card-lg" style={{ marginTop: 22, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, background: "var(--nm-soft)", color: "var(--nm-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><ModuleIcon name="discover" size={26} /></span>
          <div style={{ fontSize: 16, fontWeight: 600 }}>List your first property</div>
          <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Add photos, price and details — students can find and contact you once it's approved.</p>
          <button type="button" onClick={() => setForm("add")} className="nm-press" style={{ all: "unset", cursor: "pointer", marginTop: 4, padding: "12px 22px", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px var(--nm-font-text)" }}>Add a listing</button>
        </div>
      ) : (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {list.map((p) => {
            const s = propertyStatus(p);
            const st = STATUS_STYLE[s.tone];
            return (
              <div key={p.id} className="nm-card" style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", gap: 13, padding: 13 }}>
                  <span style={{ width: 78, height: 78, flex: "none", borderRadius: 12, overflow: "hidden", background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)" }}>
                    {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ModuleIcon name="discover" size={24} />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>€{p.rent_price}/mo</span>
                      <span style={{ padding: "3px 9px", borderRadius: 99, background: st.bg, color: st.fg, font: "600 10.5px var(--nm-font-text)" }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--nm-muted)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city} · {p.title}</div>
                    <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 11.5, color: "var(--nm-muted)" }}>
                      <span>👁 {p.views_count ?? 0} views</span>
                      <span>♥ {p.saves_count} saved</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", borderTop: "1px solid var(--nm-line)" }}>
                  <button type="button" onClick={() => setForm(p)} style={actionBtn}>Edit</button>
                  <button type="button" onClick={() => toggleVisible(p)} style={{ ...actionBtn, borderLeft: "1px solid var(--nm-line)" }}>{p.is_visible ? "Hide" : "Show"}</button>
                  {confirmId === p.id ? (
                    <button type="button" onClick={() => remove(p)} style={{ ...actionBtn, borderLeft: "1px solid var(--nm-line)", color: "#fff", background: "var(--nm-coral)" }}>Confirm</button>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(p.id)} style={{ ...actionBtn, borderLeft: "1px solid var(--nm-line)", color: "var(--nm-coral)" }}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "12px 0",
  font: "600 13px var(--nm-font-text)", color: "var(--nm-text)",
};
