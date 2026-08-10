import { useState } from "react";
import { useData } from "@/contexts/data-context";
import { IconArrowLeft } from "../icons";
import { stickyControl } from "../StickyBar";
import { cities } from "@/lib/constants";
import type { City } from "@/types/supabase";
import type { MyProperty } from "@/hooks/use-my-properties";

const field: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="nm-section-label" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>{children}</span>;
}

export function PropertyForm({ existing, onDone, onBack }: { existing?: MyProperty | null; onDone: () => void; onBack: () => void }) {
  const { createProperty, updateProperty } = useData();
  const editing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [city, setCity] = useState<City | "">(existing?.city ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [rent, setRent] = useState(existing ? String(existing.rent_price) : "");
  const [bedrooms, setBedrooms] = useState(existing ? String(existing.bedrooms) : "1");
  const [bathrooms, setBathrooms] = useState(existing ? String(existing.bathrooms) : "1");
  const [availableTo, setAvailableTo] = useState<"erasmus" | "full_time">(existing?.available_to ?? "full_time");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((f) => [...f, ...arr]);
    setPreviews((p) => [...p, ...arr.map((f) => URL.createObjectURL(f))]);
  };
  const removeFile = (i: number) => {
    setPreviews((p) => { const url = p[i]; if (url) URL.revokeObjectURL(url); return p.filter((_, j) => j !== i); });
    setFiles((f) => f.filter((_, j) => j !== i));
  };

  const canSubmit = title.trim() && city && address.trim() && Number(rent) > 0 && (editing || files.length > 0) && !busy;

  const submit = async () => {
    if (!canSubmit || !city) return;
    setBusy(true); setError(null);
    try {
      if (editing && existing) {
        await updateProperty(existing.id, {
          title: title.trim(), city, address: address.trim(), rent_price: Number(rent),
          bedrooms: Number(bedrooms), bathrooms: Number(bathrooms), available_to: availableTo,
          description: description.trim(), phone: phone || null, email: email || null,
        }, files.length ? files : undefined);
      } else {
        await createProperty({
          title: title.trim(), city, address: address.trim(), rent_price: Number(rent),
          bedrooms: Number(bedrooms), bathrooms: Number(bathrooms), available_to: availableTo,
          description: description.trim(), phone: phone.trim(), email: email.trim(), imageFiles: files,
        });
      }
      previews.forEach((u) => URL.revokeObjectURL(u));
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the listing. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 40px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>{editing ? "Edit listing" : "New listing"}</div>

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Photos */}
        <div>
          <Label>Photos{editing ? " (add to replace/extend)" : ""}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {existing?.image_urls?.slice(0, 3).map((src) => (
              <span key={src} style={{ width: 82, height: 82, borderRadius: 12, overflow: "hidden", background: "var(--nm-surface2)", opacity: 0.6 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </span>
            ))}
            {previews.map((src, i) => (
              <span key={src} style={{ position: "relative", width: 82, height: 82, borderRadius: 12, overflow: "hidden", background: "var(--nm-surface2)" }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span role="button" onClick={() => removeFile(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: 99, background: "rgba(17,24,39,.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer" }}>✕</span>
              </span>
            ))}
            <label style={{ width: 82, height: 82, borderRadius: 12, border: "1.5px dashed var(--nm-line)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", color: "var(--nm-muted)" }}>
              <input type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} style={{ display: "none" }} />
              <span style={{ fontSize: 22 }}>＋</span>
              <span style={{ fontSize: 10.5 }}>Add</span>
            </label>
          </div>
        </div>

        <div><Label>Title</Label><input style={field} placeholder="e.g. Bright 2-bed near UCY" value={title} onChange={(e) => setTitle(e.target.value)} /></div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Label>City</Label>
            <select style={field} value={city} onChange={(e) => setCity(e.target.value as City)}>
              <option value="">Select…</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}><Label>Rent €/mo</Label><input style={field} type="number" inputMode="numeric" placeholder="450" value={rent} onChange={(e) => setRent(e.target.value)} /></div>
        </div>

        <div><Label>Address / area</Label><input style={field} placeholder="Street, neighbourhood" value={address} onChange={(e) => setAddress(e.target.value)} /></div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Label>Bedrooms</Label>
            <select style={field} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </div>
          <div style={{ flex: 1 }}><Label>Bathrooms</Label>
            <select style={field} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </div>
        </div>

        <div><Label>Best suited for</Label>
          <select style={field} value={availableTo} onChange={(e) => setAvailableTo(e.target.value as "erasmus" | "full_time")}>
            <option value="full_time">Full-time students</option>
            <option value="erasmus">Erasmus students</option>
          </select>
        </div>

        <div><Label>Description</Label><textarea rows={4} style={{ ...field, resize: "vertical", minHeight: 90, font: "400 15px var(--nm-font-text)" }} placeholder="What makes this place great for students?" value={description} onChange={(e) => setDescription(e.target.value)} /></div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}><Label>Contact phone</Label><input style={field} type="tel" placeholder="+357…" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div style={{ flex: 1 }}><Label>Contact email</Label><input style={field} type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: "var(--nm-coral)" }}>{error}</div>}
        {!editing && <div style={{ fontSize: 11.5, color: "var(--nm-muted)", lineHeight: 1.5 }}>New listings are reviewed before they go live to students.</div>}

        <button type="button" onClick={submit} disabled={!canSubmit} className="nm-press" style={{ all: "unset", cursor: canSubmit ? "pointer" : "not-allowed", textAlign: "center", padding: "14px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 15px var(--nm-font-text)", opacity: canSubmit ? 1 : 0.5 }}>
          {busy ? "Saving…" : editing ? "Save changes" : "Publish listing"}
        </button>
      </div>
    </div>
  );
}
