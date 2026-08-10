import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useMyProperties, propertyStatus, STATUS_STYLE } from "@/hooks/use-my-properties";
import { IconBell, IconShield, IconChevron, ModuleIcon } from "../icons";
import { StickyBar } from "../StickyBar";
import { NotificationsScreen } from "./NotificationsScreen";
import { initialsOf } from "../util";
import type { LandlordTab } from "../TabBar";
import type { NmTab } from "../TabBar";

export function LandlordHome({ onNavigate, onAddListing }: { onNavigate: (t: LandlordTab) => void; onAddListing: () => void }) {
  const { profile, user } = useAuth();
  const { snapshot } = useData();
  const { data: properties } = useMyProperties(user?.id);
  const [showNotifs, setShowNotifs] = useState(false);

  if (showNotifs) {
    return <NotificationsScreen onBack={() => setShowNotifs(false)} onNavigate={(t: NmTab) => { if (t === "messages") onNavigate("messages"); }} />;
  }

  const list = properties ?? [];
  const totalViews = list.reduce((s, p) => s + (p.views_count ?? 0), 0);
  const totalSaves = list.reduce((s, p) => s + p.saves_count, 0);
  const unread = (snapshot.messages ?? []).filter((m) => !m.read && m.sender_id !== snapshot.profile.id).length;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const initials = initialsOf(profile?.full_name ?? "You");
  const verified = profile?.is_verified_landlord;

  const stats = [
    { n: list.length, k: "Listings" },
    { n: totalViews, k: "Views" },
    { n: totalSaves, k: "Saves" },
  ];

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      {/* Header icons pinned */}
      <StickyBar pullUp={40}>
        <button type="button" className="nm-icon-btn" onClick={() => setShowNotifs(true)} aria-label="Notifications">
          <IconBell size={18} />
          {snapshot.notifications?.length > 0 && <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: 99, background: "var(--nm-coral)" }} />}
        </button>
        <button type="button" onClick={() => onNavigate("profile")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--nm-font-text)" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </button>
      </StickyBar>

      {/* Greeting */}
      <div style={{ paddingRight: 96 }}>
        <div style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>Welcome back</div>
        <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 27, fontWeight: 600, letterSpacing: "-.03em", marginTop: 2 }}>{firstName}</div>
        <span className="nm-pill" style={{ marginTop: 9, gap: 6 }}>
          {verified ? <><IconShield size={12} /> Verified landlord</> : "Landlord"}
        </span>
      </div>

      {/* Portfolio stats */}
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 11 }}>
        {stats.map((s) => (
          <div key={s.k} className="nm-card" style={{ borderRadius: "var(--nm-r-sm)", padding: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 22, fontWeight: 700 }}>{s.n}</div>
            <div style={{ fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* Add a listing CTA */}
      <button type="button" onClick={onAddListing} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginTop: 16, width: "100%", boxSizing: "border-box", padding: "16px 18px", borderRadius: 20, background: "linear-gradient(145deg,#5B54E6,#7B6FF0)", boxShadow: "0 12px 26px -10px rgba(79,70,229,.5)" }}>
        <span style={{ width: 42, height: 42, flex: "none", borderRadius: 13, background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>＋</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: "#fff" }}>Add a listing</span>
          <span style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,.82)", marginTop: 2 }}>Photos, price, details — live after review</span>
        </span>
      </button>

      {/* Messages nudge */}
      {unread > 0 && (
        <button type="button" onClick={() => onNavigate("messages")} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginTop: 12, width: "100%", boxSizing: "border-box", padding: "14px 16px", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)" }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>You have {unread} new message{unread === 1 ? "" : "s"}</span>
          <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
        </button>
      )}

      {/* Your listings */}
      <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="nm-section-label">Your listings</div>
        {list.length > 0 && <button type="button" className="nm-link" onClick={() => onNavigate("listings")}>Manage all</button>}
      </div>

      {list.length === 0 ? (
        <div className="nm-card nm-card-lg" style={{ marginTop: 11, padding: 22, textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5 }}>No listings yet. Add your first property to start reaching students.</p>
        </div>
      ) : (
        <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
          {list.slice(0, 3).map((p) => {
            const s = propertyStatus(p); const st = STATUS_STYLE[s.tone];
            return (
              <button key={p.id} type="button" onClick={() => onNavigate("listings")} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: 12, boxShadow: "var(--nm-elev)" }}>
                <span style={{ width: 52, height: 52, flex: "none", borderRadius: 10, overflow: "hidden", background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)" }}>
                  {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ModuleIcon name="discover" size={20} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>€{p.rent_price}/mo</span>
                    <span style={{ padding: "2px 8px", borderRadius: 99, background: st.bg, color: st.fg, font: "600 10px var(--nm-font-text)" }}>{s.label}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city} · {p.views_count ?? 0} views · {p.saves_count} saved</span>
                </span>
                <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
