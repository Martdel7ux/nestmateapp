import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useUpcomingRentPayment } from "@/hooks/use-rent";
import { useUpcomingEvents } from "@/hooks/use-upcoming-events";
import { useState } from "react";
import { IconBell, IconChevron, IconKey, IconDoc, ModuleIcon, type ModuleIconName } from "../icons";
import { StickyBar } from "../StickyBar";
import { NotificationsScreen } from "./NotificationsScreen";
import { StudentEmailVerification, loadVerification } from "./StudentEmailVerification";
import { initialsOf, whenLabel, rentDueLabel } from "../util";
import type { NmTab } from "../TabBar";

type NavFn = (tab: NmTab, exploreModule?: ModuleIconName, focus?: string) => void;

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
        <span style={{ position: "absolute", top: 9, left: 9, padding: "4px 8px", borderRadius: 99, background: "rgba(17,24,39,.62)", color: "#fff", font: "600 10px var(--nm-font-text)", backdropFilter: "blur(6px)" }}>{badge}</span>
      )}
    </span>
  );
}

const AVATAR_COLORS: [string, string][] = [
  ["var(--nm-accent)", "#fff"],
  ["var(--nm-mint)", "#08281f"],
  ["var(--nm-coral)", "#41120e"],
];

/** Premium gradient feature tile used for the Community / Perks shortcuts. */
function FeatureCard({
  icon, kicker, title, sub, gradient, glow, shadow, onClick,
}: {
  icon: ModuleIconName;
  kicker: string;
  title: string;
  sub: string;
  gradient: string;
  glow: string;
  shadow: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nm-press"
      style={{ all: "unset", cursor: "pointer", flex: 1, position: "relative", overflow: "hidden", background: gradient, borderRadius: 22, padding: "16px 16px 17px", minHeight: 150, boxSizing: "border-box", display: "flex", flexDirection: "column", boxShadow: shadow }}
    >
      {/* soft corner highlight for depth */}
      <span aria-hidden style={{ position: "absolute", top: -44, right: -34, width: 128, height: 128, borderRadius: 99, background: glow, filter: "blur(2px)" }} />
      <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 22, boxShadow: "inset 0 1px 0 rgba(255,255,255,.28)" }} />

      {/* frosted icon chip */}
      <span style={{ position: "relative", width: 40, height: 40, borderRadius: 13, background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <ModuleIcon name={icon} size={21} />
      </span>

      <span style={{ flex: 1 }} />

      <span style={{ position: "relative", display: "block", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>{kicker}</span>
      <span style={{ position: "relative", display: "block", fontSize: 16.5, fontWeight: 700, letterSpacing: "-.015em", color: "#fff", marginTop: 5, lineHeight: 1.2 }}>{title}</span>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,.82)", marginTop: 6 }}>
        {sub}<IconChevron size={13} />
      </span>
    </button>
  );
}

export function HomeScreen({ onNavigate }: { onNavigate: NavFn }) {
  const { profile, user } = useAuth();
  const { snapshot } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const { data: rent } = useUpcomingRentPayment(user?.id);
  const { data: events } = useUpcomingEvents();

  // Early returns must come after all hooks so hook order stays stable.
  if (showNotifs) return <NotificationsScreen onBack={() => setShowNotifs(false)} onNavigate={onNavigate} />;
  if (showVerify) return <StudentEmailVerification onBack={() => setShowVerify(false)} />;

  const studentVerified = !!loadVerification(user?.id);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const initials = initialsOf(profile?.full_name ?? "You");

  const homes = (snapshot.featuredProperties ?? []).slice(0, 6);
  const eventList = (events ?? []).slice(0, 4);
  const matches = snapshot.matches ?? [];
  const rentDays = rent ? rentDueLabel(rent.due_date) : "";

  const tasks = [
    ...(studentVerified
      ? []
      : [{ label: "Verify your university email", note: "Unlocks student perks & trust", Icon: IconDoc, go: () => setShowVerify(true) }]),
    ...(rent
      ? [{ label: `Pay rent — €${Math.round(Number(rent.amount))}`, note: `Rent ${rentDays}`, Icon: IconKey, go: () => onNavigate("explore", "bills") }]
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
        <button type="button" onClick={() => onNavigate("profile")} style={{ all: "unset", cursor: "pointer", width: 40, height: 40, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 14px var(--nm-font-text)" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </button>
      </StickyBar>

      {/* Greeting — sits beside the pinned icons, then scrolls away normally */}
      <div style={{ paddingRight: 96 }}>
        <div style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>Welcome back</div>
        <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 27, fontWeight: 600, letterSpacing: "-.03em", marginTop: 2 }}>{firstName}</div>
        <span className="nm-pill" style={{ marginTop: 9 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--nm-accent)" }} />
          {profile?.city ? `Student in ${profile.city}` : "Student"}
        </span>
      </div>

      {/* Next for you */}
      {tasks.length > 0 && (
        <>
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
        </>
      )}

      {/* Homes that match you */}
      {homes.length > 0 && (
        <>
          <SectionHeader label="Homes suggested for you" action="See all" onAction={() => onNavigate("explore", "discover")} />
          <div className="nm-hscroll" style={{ marginTop: 11 }}>
            {homes.map((h) => (
              <button key={h.id} type="button" className="nm-press" onClick={() => onNavigate("explore", "discover", h.id)} style={{ all: "unset", cursor: "pointer", width: 196, flex: "none", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
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
      <button type="button" onClick={() => onNavigate("explore", "matches")} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "block", boxSizing: "border-box", width: "100%", marginTop: 12, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: 16, boxShadow: "var(--nm-elev)" }}>
        {matches.length > 0 ? (
          <>
            <span style={{ display: "flex" }}>
              {matches.slice(0, 3).map((m, i) => (
                <span key={m.id} style={{ width: 28, height: 28, borderRadius: 99, background: AVATAR_COLORS[i][0], color: AVATAR_COLORS[i][1], display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px var(--nm-font-text)", marginLeft: i ? -8 : 0 }}>
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
            <button type="button" className="nm-link" onClick={() => onNavigate("explore", "bills")}>Details</button>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 12 }}>
            <span style={{ fontFamily: "var(--nm-font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-.03em" }}>€{Math.round(Number(rent.amount))}</span>
            <span style={{ fontSize: 13, color: "var(--nm-muted)" }}>rent {rentDays}</span>
          </div>
        </div>
      )}

      {/* This week events */}
      {eventList.length > 0 && (
        <>
          <SectionHeader label="This week" action="All events" onAction={() => onNavigate("explore", "events")} />
          <div className="nm-hscroll" style={{ marginTop: 11 }}>
            {eventList.map((e) => (
              <button key={e.id} type="button" className="nm-press" onClick={() => onNavigate("explore", "events")} style={{ all: "unset", cursor: "pointer", width: 186, flex: "none", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
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

      {/* Community + Perks feature cards */}
      <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
        <FeatureCard
          icon="community"
          kicker="Community"
          title="Societies & events"
          sub="Find your people"
          gradient="linear-gradient(145deg, #5B54E6 0%, #8B7CF3 100%)"
          glow="radial-gradient(circle, rgba(255,255,255,.34), rgba(255,255,255,0) 70%)"
          shadow="0 14px 30px -8px rgba(79,70,229,.45)"
          onClick={() => onNavigate("explore", "community")}
        />
        <FeatureCard
          icon="deals"
          kicker="Perks"
          title="Student discounts"
          sub="Near you"
          gradient="linear-gradient(145deg, #FF6F63 0%, #FFA271 100%)"
          glow="radial-gradient(circle, rgba(255,255,255,.38), rgba(255,255,255,0) 70%)"
          shadow="0 14px 30px -8px rgba(255,111,99,.45)"
          onClick={() => onNavigate("explore", "deals")}
        />
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
