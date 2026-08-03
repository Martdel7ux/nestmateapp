import { toast } from "sonner";
import { IconArrowLeft, IconHeart, IconShield, IconMessages } from "../icons";
import { initialsOf } from "../util";
import type { Property } from "@/types/supabase";

export function PropertyDetail({
  property, saved, onBack, onToggleSave,
}: {
  property: Property;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
}) {
  const images = (property.image_urls ?? []).filter(Boolean);
  const typeLabel = property.available_to === "erasmus" ? "Erasmus / short-term" : "Full-time students";
  const ownerName = property.owner?.full_name ?? "Landlord";

  const facts: [string, string][] = [
    ["Rent", `€${property.rent_price} / mo`],
    ["Bedrooms", String(property.bedrooms)],
    ["Bathrooms", String(property.bathrooms)],
    ["City", property.city],
  ];

  const contact = () => {
    const digits = property.phone?.replace(/\D/g, "");
    if (property.has_whatsapp && digits) window.open(`https://wa.me/${digits}`, "_blank");
    else if (digits) window.open(`tel:${property.phone}`, "_self");
    else if (property.email) window.open(`mailto:${property.email}`, "_self");
    else toast.error("No contact details provided for this listing.");
  };

  return (
    <div style={{ margin: "-20px -20px 0", paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 300, background: "var(--nm-surface2)" }}>
        {images.length > 0
          ? (
            <div className="nm-hscroll" style={{ gap: 0, height: "100%" }}>
              {images.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: images.length > 1 ? "90%" : "100%", height: "100%", objectFit: "cover", flex: "none", scrollSnapAlign: "start" }} />
              ))}
            </div>
          )
          : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)" }}>No photos</div>}
        <div style={{ position: "absolute", top: "calc(14px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", justifyContent: "space-between" }}>
          <button type="button" onClick={onBack} aria-label="Back" style={{ all: "unset", cursor: "pointer", width: 38, height: 38, borderRadius: 99, background: "rgba(17,24,39,.55)", backdropFilter: "blur(8px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconArrowLeft size={17} />
          </button>
          <button type="button" onClick={onToggleSave} aria-label="Save" style={{ all: "unset", cursor: "pointer", width: 38, height: 38, borderRadius: 99, background: "rgba(17,24,39,.55)", backdropFilter: "blur(8px)", color: saved ? "var(--nm-coral)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconHeart size={19} />
          </button>
        </div>
      </div>

      {/* Sheet */}
      <div style={{ marginTop: -26, position: "relative", background: "var(--nm-bg)", borderRadius: "26px 26px 0 0", padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em" }}>€{property.rent_price} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--nm-muted)" }}>/ mo</span></div>
            <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 4 }}>{property.title} · {property.address || property.city}</div>
          </div>
          {property.average_rating != null && (
            <div style={{ padding: "7px 12px", borderRadius: 99, background: "var(--nm-soft)", color: "var(--nm-accent)", font: "600 12px Inter, sans-serif", whiteSpace: "nowrap" }}>★ {property.average_rating.toFixed(1)}</div>
          )}
        </div>

        {/* Facts */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {facts.map(([k, v]) => (
            <div key={k} className="nm-card" style={{ borderRadius: "var(--nm-r-sm)", padding: "13px 14px" }}>
              <div style={{ font: "500 11px Inter, sans-serif", color: "var(--nm-muted)" }}>{k}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {property.description && (
          <p style={{ marginTop: 18, fontSize: 14, lineHeight: 1.55, color: "var(--nm-text)" }}>{property.description}</p>
        )}

        {/* Landlord */}
        <div className="nm-card" style={{ marginTop: 18, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px Inter, sans-serif" }}>
            {property.owner?.avatar_url ? <img src={property.owner.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(ownerName)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{ownerName} · Landlord</div>
            <div style={{ fontSize: 12, color: "var(--nm-muted)", marginTop: 2 }}>{typeLabel}</div>
          </div>
          {property.is_approved && <span style={{ color: "var(--nm-mint)" }}><IconShield size={19} /></span>}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button type="button" onClick={onToggleSave} aria-label="Save" style={{ all: "unset", cursor: "pointer", flex: "none", width: 56, height: 54, borderRadius: "var(--nm-r-md)", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: saved ? "var(--nm-coral)" : "var(--nm-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconHeart size={20} />
          </button>
          <button type="button" onClick={contact} style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: 17, borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 15.5px Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IconMessages size={18} /> Contact landlord
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--nm-muted)", textAlign: "center", marginTop: 11 }}>Always view a place before paying a deposit.</div>
      </div>
    </div>
  );
}
