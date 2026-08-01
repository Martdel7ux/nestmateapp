import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { useUpcomingRentPayment } from "@/hooks/use-rent";
import { useOpportunities } from "@/hooks/use-opportunities";
import { ModuleIcon, IconArrowLeft, IconChevron, type ModuleIconName } from "../icons";
import { rentDueLabel } from "../util";

type ModuleId = ModuleIconName;

const MODULES: { id: ModuleId; label: string; note: string }[] = [
  { id: "discover", label: "Accommodation", note: "Verified homes" },
  { id: "matches", label: "Roommates", note: "Matched on habits" },
  { id: "bills", label: "Rent & bills", note: "Split and track" },
  { id: "jobs", label: "Jobs", note: "Internships & grad roles" },
  { id: "events", label: "Events", note: "Socials, sport, careers" },
  { id: "community", label: "Communities", note: "Societies & countries" },
  { id: "campus", label: "Campus services", note: "Library, gym, health" },
  { id: "market", label: "Marketplace", note: "Buy & sell on campus" },
  { id: "deals", label: "Discounts", note: "14 near you" },
  { id: "move", label: "Relocation plan", note: "Arrival checklist" },
  { id: "ai", label: "AI assistant", note: "Ask anything" },
];

const FOR_YOU = [
  { label: "Airport pickup, 9 Oct", note: "Shared ride from Larnaca · €12", go: "move" as ModuleId },
  { label: "Ghanaian Students Nicosia", note: "412 members · 6 arriving with you", go: "community" as ModuleId },
];

function SubHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>{subtitle}</div>}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
      <span className="nm-pill">Nothing here yet</span>
      <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>{text}</p>
    </div>
  );
}

/** Accommodation — real properties from the data context. */
function DiscoverBody() {
  const { snapshot } = useData();
  const homes = (snapshot.featuredProperties ?? []).slice(0, 12);
  if (homes.length === 0) return <EmptyNote text="No verified homes to show right now — check back soon." />;
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      {homes.map((h) => (
        <div key={h.id} className="nm-card" style={{ overflow: "hidden" }}>
          <div style={{ height: 130, position: "relative", background: "var(--nm-surface2)" }}>
            {h.image_urls?.[0] && <img src={h.image_urls[0]} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            {h.average_rating != null && (
              <span style={{ position: "absolute", top: 10, left: 10, padding: "4px 9px", borderRadius: 99, background: "rgba(17,24,39,.62)", color: "#fff", font: "600 10.5px Inter, sans-serif", backdropFilter: "blur(6px)" }}>★ {h.average_rating.toFixed(1)}</span>
            )}
          </div>
          <div style={{ padding: "13px 15px 15px" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>€{h.rent_price} / mo · {h.city}</div>
            <div style={{ fontSize: 12, color: "var(--nm-muted)", marginTop: 3 }}>{h.bedrooms} bed · {h.bathrooms} bath · {h.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Jobs & internships — real opportunities. */
function JobsBody() {
  const { data } = useOpportunities({ type: "job" });
  const jobs = (data?.pages.flat() ?? []).slice(0, 15);
  if (jobs.length === 0) return <EmptyNote text="No graduate roles or internships posted yet." />;
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      {jobs.map((j) => (
        <div key={j.id} className="nm-card" style={{ display: "flex", gap: 13, alignItems: "center", padding: "15px 16px" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px Inter, sans-serif", color: "var(--nm-muted)" }}>
            {(j.organization ?? "?").slice(0, 2).toUpperCase()}
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{j.title}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2 }}>{j.organization ?? "—"} · {j.location ?? j.location_type ?? "Cyprus"}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Rent & bills — real upcoming payment. */
function BillsBody() {
  const { user } = useAuth();
  const { data: rent } = useUpcomingRentPayment(user?.id);
  if (!rent) return <EmptyNote text="No rent agreement set up yet. Add one to track rent and split bills." />;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="nm-card nm-card-lg" style={{ padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Next rent</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.03em" }}>€{Math.round(Number(rent.amount))}</span>
          <span style={{ fontSize: 13, color: "var(--nm-muted)" }}>{rentDueLabel(rent.due_date)}</span>
        </div>
      </div>
    </div>
  );
}

function SubBody({ id }: { id: ModuleId }) {
  if (id === "discover") return <DiscoverBody />;
  if (id === "jobs") return <JobsBody />;
  if (id === "bills") return <BillsBody />;
  return (
    <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
      <span className="nm-pill">Building this next</span>
      <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>
        This section is part of the redesign in progress — the full experience is on its way.
      </p>
    </div>
  );
}

const SUB_META: Record<ModuleId, { title: string; subtitle: string }> = {
  discover: { title: "Accommodation", subtitle: "Verified homes matched to how you live." },
  matches: { title: "Roommates", subtitle: "Matched on budget, habits and study style." },
  bills: { title: "Rent & bills", subtitle: "Track rent and split shared costs with your flat." },
  jobs: { title: "Jobs & internships", subtitle: "Roles that fit your visa status and your year." },
  events: { title: "Events", subtitle: "On campus and around Nicosia." },
  community: { title: "Communities", subtitle: "Societies and country groups." },
  campus: { title: "Campus services", subtitle: "Library, gym, health and more." },
  market: { title: "Marketplace", subtitle: "Buy and sell with other students." },
  deals: { title: "Student discounts", subtitle: "Perks near you." },
  move: { title: "Relocation plan", subtitle: "Your arrival checklist." },
  ai: { title: "AI assistant", subtitle: "Knows your timetable, flat and societies." },
};

export function ExploreScreen() {
  const [view, setView] = useState<"hub" | ModuleId>("hub");

  if (view !== "hub") {
    const meta = SUB_META[view];
    return (
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .3s ease-out" }}>
        <SubHeader title={meta.title} subtitle={meta.subtitle} onBack={() => setView("hub")} />
        <SubBody id={view} />
        <div style={{ height: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Explore</div>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>Everything NestMate does, in one place.</div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            className="nm-card nm-press"
            onClick={() => setView(m.id)}
            style={{ all: "unset", cursor: "pointer", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: 16, boxShadow: "var(--nm-elev)" }}
          >
            <span style={{ display: "flex", width: 38, height: 38, borderRadius: 13, background: "var(--nm-soft)", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
              <ModuleIcon name={m.id} size={20} />
            </span>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, marginTop: 12 }}>{m.label}</span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 3, lineHeight: 1.4 }}>{m.note}</span>
          </button>
        ))}
      </div>

      <div className="nm-section-label" style={{ marginTop: 22 }}>Because you're arriving</div>
      <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 10 }}>
        {FOR_YOU.map((f) => (
          <button
            key={f.label}
            type="button"
            className="nm-card nm-press"
            onClick={() => setView(f.go)}
            style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}
          >
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>{f.label}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2 }}>{f.note}</span>
            </span>
            <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
          </button>
        ))}
      </div>
      <div style={{ height: 12 }} />
    </div>
  );
}
