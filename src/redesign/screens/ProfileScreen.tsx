import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useTheme } from "@/contexts/theme-context";
import { IconGear, IconShield, IconChevron, IconArrowLeft } from "../icons";
import { initialsOf } from "../util";

function SettingsView({ onBack }: { onBack: () => void }) {
  const { signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const dark = resolvedTheme === "dark";

  const rows = [
    { k: "Account", v: "Email & password" },
    { k: "Notifications", v: "" },
    { k: "Privacy & documents", v: "Encrypted" },
    { k: "Help & support", v: "" },
  ];

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Settings</div>

      <div className="nm-card" style={{ marginTop: 20, overflow: "hidden" }}>
        <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "center", gap: 12, padding: 16 }}>
          <span style={{ flex: 1, fontSize: 14.5 }}>Dark mode</span>
          <span style={{ width: 46, height: 28, borderRadius: 99, background: dark ? "var(--nm-accent)" : "var(--nm-surface2)", padding: 3, display: "flex", transition: "background .25s" }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: "#fff", transition: "transform .25s", transform: `translateX(${dark ? "18px" : "0"})` }} />
          </span>
        </button>
        {rows.map((r) => (
          <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderTop: "1px solid var(--nm-line)" }}>
            <span style={{ flex: 1, fontSize: 14.5 }}>{r.k}</span>
            {r.v && <span style={{ fontSize: 13, color: "var(--nm-muted)" }}>{r.v}</span>}
            <span style={{ color: "var(--nm-muted)" }}><IconChevron size={14} /></span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="nm-card nm-press"
        onClick={async () => { await signOut(); navigate("/welcome"); }}
        style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", textAlign: "center", width: "100%", marginTop: 16, padding: 16, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", color: "var(--nm-coral)", font: "600 14.5px Inter, sans-serif" }}
      >
        Sign out
      </button>

      <div style={{ marginTop: 16, fontSize: 11.5, lineHeight: 1.6, color: "var(--nm-muted)" }}>
        NestMate · Your documents are stored encrypted and never shared.
      </div>
    </div>
  );
}

export function ProfileScreen() {
  const [view, setView] = useState<"profile" | "settings">("profile");
  const { profile } = useAuth();
  const { snapshot } = useData();

  if (view === "settings") return <SettingsView onBack={() => setView("profile")} />;

  const name = profile?.full_name ?? "Your profile";

  const checks = [
    { ok: !!profile?.avatar_url, badge: "Photo added" },
    { ok: !!profile?.bio, badge: "Bio written" },
    { ok: !!profile?.university, badge: "University set" },
    { ok: !!profile?.city, badge: "City set" },
    { ok: !!profile?.accepted_terms_at, badge: "Verified" },
  ];
  const filled = checks.filter((c) => c.ok).length;
  const score = Math.round((filled / checks.length) * 100);
  const verified = score >= 80;
  const badges = checks.filter((c) => c.ok).map((c) => c.badge);

  const stats = [
    { n: snapshot.savedProperties?.length ?? 0, k: "Saved" },
    { n: snapshot.matches?.length ?? 0, k: "Matches" },
    { n: snapshot.notifications?.length ?? 0, k: "Alerts" },
  ];

  const about = [
    { k: "University", v: profile?.university || "—" },
    { k: "City", v: profile?.city || "—" },
    { k: "Role", v: profile?.user_type === "landlord" ? "Landlord" : "Student" },
    { k: "Member since", v: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—" },
  ];

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        <div style={{ width: 66, height: 66, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 22px Inter, sans-serif" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.02em" }}>{name}</div>
          <div style={{ fontSize: 12.5, color: "var(--nm-muted)", marginTop: 3 }}>
            {[profile?.university, profile?.city].filter(Boolean).join(" · ") || "Complete your profile"}
          </div>
        </div>
        <button type="button" className="nm-icon-btn nm-press" onClick={() => setView("settings")} aria-label="Settings" style={{ width: 38, height: 38 }}>
          <IconGear size={18} />
        </button>
      </div>

      {/* Trust / verification */}
      <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: verified ? "var(--nm-mint)" : "var(--nm-muted)" }}><IconShield size={19} /></span>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{verified ? "Verified profile" : "Getting verified"}</div>
          <div style={{ flex: 1 }} />
          <div style={{ font: "600 14px Inter, sans-serif", color: verified ? "var(--nm-mint)" : "var(--nm-accent)" }}>{score}</div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 13 }}>
          {badges.length > 0 ? badges.map((b) => (
            <span key={b} style={{ padding: "6px 11px", borderRadius: 99, background: "var(--nm-mint-soft)", font: "500 11.5px Inter, sans-serif" }}>{b}</span>
          )) : (
            <span style={{ fontSize: 12.5, color: "var(--nm-muted)" }}>Add a photo, bio and university to build trust.</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 11 }}>
        {stats.map((s) => (
          <div key={s.k} className="nm-card" style={{ borderRadius: "var(--nm-r-sm)", padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.02em" }}>{s.n}</div>
            <div style={{ fontSize: 11, color: "var(--nm-muted)", marginTop: 3 }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* About me */}
      <div className="nm-section-label" style={{ marginTop: 20 }}>About me</div>
      <div className="nm-card" style={{ marginTop: 11, padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
        {about.map((r) => (
          <div key={r.k} style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
            <span style={{ fontSize: 13, color: "var(--nm-muted)" }}>{r.k}</span>
            <span style={{ fontSize: 13.5, fontWeight: 500, textAlign: "right" }}>{r.v}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
