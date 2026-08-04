import { useState } from "react";
import { toast } from "sonner";
import { useDiscoverGroups, useJoinStudyGroup } from "@/hooks/use-study-groups";
import { useMarketplaceListings, useCreateMarketplaceListing, usePerks } from "@/hooks/use-marketplace";
import { ModuleIcon } from "../icons";

const CATEGORIES = ["Furniture", "Books", "Electronics", "Bikes", "Other"];
const noteCard = { marginTop: 18, padding: 26, textAlign: "center" as const, display: "flex", flexDirection: "column" as const, alignItems: "center" as const, gap: 10 };

type Seg = "societies" | "market" | "perks";
const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "societies", label: "Societies" },
  { key: "market", label: "Marketplace" },
  { key: "perks", label: "Perks" },
];

export function SocietiesBody() {
  const { data: groups, isLoading } = useDiscoverGroups();
  const join = useJoinStudyGroup();
  const list = groups ?? [];

  if (isLoading) return <div style={{ marginTop: 22, textAlign: "center", color: "var(--nm-muted)", fontSize: 13 }}>Loading…</div>;
  if (list.length === 0) {
    return (
      <div className="nm-card nm-card-lg" style={{ marginTop: 18, padding: 26, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <span className="nm-pill">No societies yet</span>
        <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Communities, course groups and country societies will appear here.</p>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      {list.map((g) => {
        const joined = g.member_role != null;
        return (
          <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
            <span style={{ width: 38, height: 38, flex: "none", borderRadius: 13, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
              <ModuleIcon name="community" size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{g.name}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {(g.member_count ?? 0)} members{g.course?.title ? ` · ${g.course.title}` : ""}
              </span>
            </span>
            <button
              type="button"
              disabled={joined || join.isPending}
              onClick={() => !joined && join.mutate(g.id)}
              style={{ all: "unset", cursor: joined ? "default" : "pointer", padding: "7px 14px", borderRadius: 99, border: `1px solid ${joined ? "var(--nm-soft)" : "var(--nm-accent)"}`, color: joined ? "var(--nm-muted)" : "var(--nm-accent)", background: joined ? "var(--nm-soft)" : "transparent", font: "600 11.5px Inter, sans-serif" }}
            >
              {joined ? "Joined" : "Join"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const formInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface2)", fontSize: 16, color: "var(--nm-text)",
};

export function MarketBody() {
  const { data, isLoading } = useMarketplaceListings();
  const create = useCreateMarketplaceListing();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const listings = data ?? [];

  const pickImage = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setOpen(false); setTitle(""); setPrice("");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(null);
  };

  const submit = () => {
    if (!title.trim() || !price) { toast.error("Add a title and a price."); return; }
    create.mutate(
      { title: title.trim(), price: Number(price), category, imageFile },
      {
        onSuccess: () => { toast.success("Listed!"); resetForm(); },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Could not list — is the marketplace table set up?"),
      },
    );
  };

  return (
    <>
      {open && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Photo picker */}
          <label style={{ display: "block", cursor: "pointer", position: "relative", height: 150, borderRadius: "var(--nm-r-sm)", overflow: "hidden", background: "var(--nm-surface2)", border: imagePreview ? "none" : "1.5px dashed var(--nm-line)" }}>
            <input type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span
                  role="button"
                  onClick={(e) => { e.preventDefault(); pickImage(null); }}
                  style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 99, background: "rgba(17,24,39,.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, backdropFilter: "blur(6px)" }}
                >✕</span>
              </>
            ) : (
              <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--nm-muted)" }}>
                <ModuleIcon name="market" size={26} />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Add a photo</span>
              </span>
            )}
          </label>

          <input style={formInput} placeholder="What are you selling?" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...formInput, flex: 1 }} type="number" placeholder="Price €" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select style={{ ...formInput, flex: 1 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={resetForm} style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: 12, borderRadius: "var(--nm-r-sm)", background: "var(--nm-surface2)", font: "600 14px Inter, sans-serif", color: "var(--nm-muted)" }}>Cancel</button>
            <button type="button" disabled={create.isPending} onClick={submit} style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: 12, borderRadius: "var(--nm-r-sm)", background: "var(--nm-accent)", color: "#fff", font: "600 14px Inter, sans-serif", opacity: create.isPending ? 0.7 : 1 }}>{create.isPending ? "Posting…" : "Post"}</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ marginTop: 22, textAlign: "center", color: "var(--nm-muted)", fontSize: 13 }}>Loading…</div>
      ) : listings.length === 0 ? (
        <div className="nm-card nm-card-lg" style={noteCard}>
          <span className="nm-pill">Nothing listed yet</span>
          <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Be the first to list something for other students.</p>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          {listings.map((m) => (
            <div key={m.id} className="nm-card" style={{ overflow: "hidden" }}>
              <div style={{ height: 96, background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)" }}>
                {m.image_url ? <img src={m.image_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ModuleIcon name="market" size={30} />}
              </div>
              <div style={{ padding: "12px 13px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>€{Math.round(Number(m.price))}</div>
                <div style={{ fontSize: 12.5, marginTop: 3 }}>{m.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--nm-muted)", marginTop: 5 }}>{m.seller?.full_name ?? "Student"}{m.city ? ` · ${m.city}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", textAlign: "center", marginTop: 18, padding: 16, borderRadius: "var(--nm-r-md)", border: "1px solid var(--nm-accent)", color: "var(--nm-accent)", font: "600 15px Inter, sans-serif" }}>
        {open ? "Close" : "List something"}
      </button>
    </>
  );
}

export function PerksBody() {
  const { data, isLoading } = usePerks();
  const perks = data ?? [];
  if (isLoading) return <div style={{ marginTop: 22, textAlign: "center", color: "var(--nm-muted)", fontSize: 13 }}>Loading…</div>;
  if (perks.length === 0) {
    return (
      <div className="nm-card nm-card-lg" style={noteCard}>
        <span className="nm-pill">No perks yet</span>
        <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Student discounts around your city will appear here once added.</p>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 11 }}>
      {perks.map((d) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 13, background: "var(--nm-coral-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-coral)" }}>
            <ModuleIcon name="deals" size={20} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{d.name}</span>
            {d.description && <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2 }}>{d.description}</span>}
          </span>
          <span style={{ font: "600 14px Inter, sans-serif", color: "var(--nm-coral)" }}>{d.discount}</span>
        </div>
      ))}
    </div>
  );
}

export function CommunityScreen() {
  const [seg, setSeg] = useState<Seg>("societies");

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Community</div>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>Societies, marketplace and perks — your people on campus.</div>

      {/* Segmented control */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        {SEGMENTS.map((s) => {
          const on = seg === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSeg(s.key)}
              style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 99, font: "600 12.5px Inter, sans-serif", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {seg === "societies" && <SocietiesBody />}
      {seg === "market" && <MarketBody />}
      {seg === "perks" && <PerksBody />}

      <div style={{ height: 12 }} />
    </div>
  );
}
