import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useUpcomingRentPayment } from "@/hooks/use-rent";
import { useUpcomingEvents } from "@/hooks/use-upcoming-events";
import { useState } from "react";
import { IconBell, IconChevron, IconKey, IconDoc } from "../icons";
import { StickyBar } from "../StickyBar";
import { NotificationsScreen } from "./NotificationsScreen";
import { initialsOf, whenLabel, rentDueLabel } from "../util";
import type { NmTab } from "../TabBar";

function SectionHeader({ label, action, onAction }: { label: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <div className="nm-section-label">{label}</div>
      {action && <button type="button" className="nm-link" onClick={onAction}>{action}</button>}
    </div>
  );
}

function ImageSlot({ h, src, tint = "var(--nm-accent)", badge }: { h: number; src?: string | null; tint?: string; badge?: string }) {
  return (
    <span style={{ display: "block", height: h, position: "relative", background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 26%, var(--nm-surface2)), var(--nm-surface2))` }}>
      {src && (
        <img src={src} alt="" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {badge && (
        <span style={{ position: "absolute", top: 9, left: 9, padding: "4px 8px", borderRadius: 99, background: "rgba(17,24,39,.62)", color: "#fff", font: "600 10px Inter, sans-serif", backdropFilter: "blur(6px)" }}>{badge}</span>
      )}
    </span>
  );
}

const AVATAR_COLORS: [string, string][] = [
  ["var(--nm-accent)", "#fff"],
  ["var(--nm-mint)", "#08281f"],
  ["var(--nm-coral)", "#41120e"],
];

export function HomeScreen({ onNavigate }: { onNavigate: (t: NmTab) => void }) {
  const { profile, user } = useAuth();
  const { snapshot } = useData();
  const [showNotifs, setShowNotifs] = useState(false);

  if (showNotifs) return <NotificationsScreen onBack={() => setShowNotifs(false)} onNavigate={onNavigate} />;
  const { data: rent } = useUpcomingRentPayment(user?.id);
  const { data: events } = useUpcomingEvents();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const initials = initialsOf(profile?.full_name ?? "You");

  const homes = (snapshot.featuredProperties ?? []).slice(0, 6);
  const eventList = (events ?? []).slice(0, 4);
  const matches = snapshot.matches ?? [];
  const rentDays = rent ? rentDueLabel(rent.due_date) : "";

  const tasks = [
    { label: "Verify your university email", note: "Unlocks student perks & trust", Icon: IconDoc, go: () => onNavigate("profile") },
    ...(rent
      ? [{ label: `Pay rent — €${Math.round(Number(rent.amount))}`, note: `Rent ${rentDays}`, Icon: IconKey, go: () => onNavigate("explore") }]
      : []),
  ];

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      {/* Header — icon cluster stays pinned while the page scrolls beneath it */}
      <StickyBar pullUp={40}>
        <button type="button" className="nm-icon-btn" onClick={() => setShowNotifs(true)} aria-label="Notifications">
          <IconBell size={18} />
          {snapshot.notifications?.length > 0 && (
            <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: 99, background: "var(--nm-coral)" }} />
          )}
        </button>
        <button type="button" onClick={() => onNavigate("profile")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px Inter, sans-serif" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </button>
      </StickyBar>

      {/* Greeting — sits beside the pinned icons, then scrolls away normally */}
      <div style={{ paddingRight: 96 }}>
        <div style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>Welcome back</div>
        <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em", marginTop: 2 }}>{firstName}</div>
        <span className="nm-pill" style={{ marginTop: 9 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--nm-accent)" }} />
          {profile?.city ? `Student in ${profile.city}` : "Student"}
        </span>
      </div>

      {/* Next for you */}
      <div className="nm-section-label" style={{ marginTop: 22 }}>Next for you</div>
      <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((t) => (
          <button key={t.label} type="button" className="nm-press" onClick={t.go} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
            <span style={{ width: 36, height: 36, flex: "none", borderRadius: 12, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
              <t.Icon size={19} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 500 }}>{t.label}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2 }}>{t.note}</span>
            </span>
            <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
          </button>
        ))}
      </div>

      {/* Homes that match you */}
      {homes.length > 0 && (
        <>
          <SectionHeader label="Homes for you" action="See all" onAction={() => onNavigate("explore")} />
          <div className="nm-hscroll" style={{ marginTop: 11 }}>
            {homes.map((h) => (
              <button key={h.id} type="button" className="nm-press" onClick={() => onNavigate("explore")} style={{ all: "unset", cursor: "pointer", width: 196, flex: "none", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
                <ImageSlot h={112} src={h.image_urls?.[0]} badge={h.average_rating ? `★ ${h.average_rating.toFixed(1)}` : undefined} />
                <span style={{ display: "block", padding: "12px 13px 14px" }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>€{h.rent_price} / mo</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 3 }}>{h.city} · {h.bedrooms} bed</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Roommate matches */}
      <button type="button" onClick={() => onNavigate("explore")} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", marginTop: 12, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: 16, boxShadow: "var(--nm-elev)" }}>
        {matches.length > 0 ? (
          <>
            <span style={{ display: "flex" }}>
              {matches.slice(0, 3).map((m, i) => (
                <span key={m.id} style={{ width: 28, height: 28, borderRadius: 99, background: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1], display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px Inter, sans-serif", marginLeft: i ? -8 : 0 }}>
                  {initialsOf(m.other_profile?.profile?.full_name)}
                </span>
              ))}
            </span>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 12 }}>{matches.length} roommate {matches.length === 1 ? "match" : "matches"}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 3 }}>Say hello and find your flat together</span>
          </>
        ) : (
          <>
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600 }}>Find your roommates</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 3 }}>Matched on budget, habits and study style</span>
          </>
        )}
      </button>

      {/* Rent & bills */}
      {rent && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 22, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Rent &amp; bills</div>
            <button type="button" className="nm-link" onClick={() => onNavigate("explore")}>Details</button>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.03em" }}>€{Math.round(Number(rent.amount))}</span>
            <span style={{ fontSize: 13, color: "var(--nm-muted)" }}>rent {rentDays}</span>
          </div>
        </div>
      )}

      {/* This week events */}
      {eventList.length > 0 && (
        <>
          <SectionHeader label="This week" action="All events" onAction={() => onNavigate("explore")} />
          <div className="nm-hscroll" style={{ marginTop: 11 }}>
            {eventList.map((e) => (
              <button key={e.id} type="button" className="nm-press" onClick={() => onNavigate("explore")} style={{ all: "unset", cursor: "pointer", width: 186, flex: "none", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
                <ImageSlot h={96} src={e.image_url} tint="var(--nm-coral)" badge={whenLabel(e.starts_at)} />
                <span style={{ display: "block", padding: "12px 13px 14px" }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{e.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 4 }}>{e.location ?? e.organization ?? "Nicosia"}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Societies + Perks */}
      <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
        <button type="button" onClick={() => onNavigate("explore")} className="nm-press" style={{ all: "unset", cursor: "pointer", flex: 1, background: "var(--nm-mint-soft)", borderRadius: "var(--nm-r-md)", padding: "15px 16px" }}>
          <span className="nm-section-label" style={{ fontSize: 11 }}>Community</span>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>Societies & events</span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 4 }}>Find your people</span>
        </button>
        <button type="button" onClick={() => onNavigate("explore")} className="nm-press" style={{ all: "unset", cursor: "pointer", width: 118, flex: "none", background: "var(--nm-coral-soft)", borderRadius: "var(--nm-r-md)", padding: "15px 16px" }}>
          <span className="nm-section-label" style={{ fontSize: 11 }}>Perks</span>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginTop: 6, lineHeight: 1.35 }}>Student discounts</span>
          <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 4 }}>Near you</span>
        </button>
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
