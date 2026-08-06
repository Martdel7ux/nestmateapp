import { useState } from "react";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useToggleSave } from "@/hooks/use-saved-opportunities";
import { IconArrowLeft, IconHeart, IconChevron } from "../icons";
import { stickyControl } from "../StickyBar";
import type { Opportunity } from "@/types/discover";

const LOCATION_LABEL: Record<string, string> = { in_person: "In person", remote: "Online", hybrid: "Hybrid" };

function startDate(o: Opportunity): Date | null {
  if (!o.starts_at) return null;
  const d = new Date(o.starts_at);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateBadge(d: Date | null): { day: string; month: string } {
  if (!d) return { day: "–", month: "TBA" };
  return { day: String(d.getDate()), month: d.toLocaleDateString("en-GB", { month: "short" }) };
}

function timeRange(o: Opportunity): string {
  const s = startDate(o);
  if (!s) return "Date to be announced";
  const day = s.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = s.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time}`;
}

function gcalStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function calendarUrl(o: Opportunity): string | null {
  const s = startDate(o);
  if (!s) return null;
  const e = o.ends_at ? new Date(o.ends_at) : new Date(s.getTime() + 2 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: o.title,
    dates: `${gcalStamp(s)}/${gcalStamp(e)}`,
    details: o.description ?? "",
    location: o.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventsBody() {
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [locType, setLocType] = useState<"" | "in_person" | "remote" | "hybrid">("");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Opportunity | null>(null);

  const { data, isLoading } = useOpportunities({
    type: "event",
    location_type: locType || undefined,
    query: query.trim() || undefined,
  });

  if (detail) return <EventDetail event={detail} onBack={() => setDetail(null)} />;

  const now = Date.now();
  const events = (data?.pages.flat() ?? [])
    .filter((e) => !onlyUpcoming || !e.starts_at || new Date(e.starts_at).getTime() >= now - 12 * 60 * 60 * 1000)
    .sort((a, b) => {
      const ta = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
      const tb = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
      return ta - tb;
    })
    .slice(0, 40);

  const activeCount = [locType, query.trim()].filter(Boolean).length;

  return (
    <div style={{ marginTop: 16 }}>
      {/* Upcoming / All toggle */}
      <div style={{ display: "flex", gap: 8, padding: 4, borderRadius: 99, background: "var(--nm-surface2)" }}>
        {([[true, "Upcoming"], [false, "All events"]] as const).map(([v, label]) => (
          <button key={label} type="button" onClick={() => setOnlyUpcoming(v)} className="nm-press" style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 99, font: "600 13px var(--nm-font-text)", background: onlyUpcoming === v ? "var(--nm-surface)" : "transparent", color: onlyUpcoming === v ? "var(--nm-text)" : "var(--nm-muted)", boxShadow: onlyUpcoming === v ? "var(--nm-elev)" : "none" }}>{label}</button>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => setShowFilters((v) => !v)} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: activeCount > 0 || showFilters ? "var(--nm-soft)" : "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: activeCount > 0 || showFilters ? "var(--nm-accent)" : "var(--nm-text)", font: "600 12.5px var(--nm-font-text)" }}>
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={() => { setLocType(""); setQuery(""); }} style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 99, color: "var(--nm-muted)", font: "600 12.5px var(--nm-font-text)" }}>Clear</button>
        )}
      </div>

      {showFilters && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 12, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={filterInput} type="text" placeholder="Search events…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div>
            <div className="nm-section-label" style={{ fontSize: 11, marginBottom: 8 }}>Format</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {([["", "Any"], ["in_person", "In person"], ["remote", "Online"], ["hybrid", "Hybrid"]] as const).map(([v, label]) => {
                const on = locType === v;
                return <button key={v || "any"} type="button" onClick={() => setLocType(v)} style={{ all: "unset", cursor: "pointer", padding: "6px 12px", borderRadius: 99, font: "500 12px var(--nm-font-text)", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}>{label}</button>;
              })}
            </div>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <span className="nm-pill">Nothing here yet</span>
          <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>{isLoading ? "Loading events…" : activeCount > 0 ? "No events match these filters." : "No events posted yet — check back soon."}</p>
        </div>
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((e) => {
            const badge = dateBadge(startDate(e));
            return (
              <button key={e.id} type="button" onClick={() => setDetail(e)} className="nm-card nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", gap: 13, alignItems: "center", padding: "13px 15px", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)" }}>
                <span style={{ width: 52, height: 52, flex: "none", borderRadius: 14, background: "var(--nm-soft)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{badge.day}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>{badge.month}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[e.organization, e.location ?? (e.location_type ? LOCATION_LABEL[e.location_type] : null)].filter(Boolean).join(" · ") || timeRange(e)}</span>
                </span>
                <IconChevron />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventDetail({ event, onBack }: { event: Opportunity; onBack: () => void }) {
  const saved = !!event.is_saved;
  const toggle = useToggleSave(event.id, saved);
  const calUrl = calendarUrl(event);
  const infoUrl = event.url ?? event.source_url ?? null;

  const facts = [
    timeRange(event),
    event.location ?? (event.location_type ? LOCATION_LABEL[event.location_type] : null),
    event.organization,
  ].filter(Boolean) as string[];

  return (
    <div style={{ paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      <button type="button" onClick={onBack} aria-label="Back" className="nm-icon-btn nm-press" style={{ ...stickyControl, marginBottom: 14 }}>
        <IconArrowLeft />
      </button>

      <div className="nm-card" style={{ overflow: "hidden" }}>
        {event.image_url ? (
          <img src={event.image_url} alt="" style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ height: 120, background: "linear-gradient(120deg, var(--nm-soft), var(--nm-surface2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎉</div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 23, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1.2 }}>{event.title}</div>
      </div>

      {facts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {facts.map((f, i) => (
            <span key={i} style={{ padding: "7px 12px", borderRadius: 99, background: i === 0 ? "var(--nm-soft)" : "var(--nm-surface2)", color: i === 0 ? "var(--nm-accent)" : "var(--nm-muted)", font: "600 12px var(--nm-font-text)" }}>{f}</span>
          ))}
        </div>
      )}

      {event.description && (
        <p style={{ marginTop: 18, fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{event.description}</p>
      )}

      {event.tags && event.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {event.tags.map((t) => <span key={t} className="nm-pill">{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          type="button" onClick={() => toggle.mutate()} disabled={toggle.isPending}
          className="nm-press" aria-label={saved ? "Unsave" : "Save"}
          style={{ all: "unset", cursor: "pointer", flex: "none", width: 54, height: 54, borderRadius: "var(--nm-r-md)", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: saved ? "var(--nm-coral)" : "var(--nm-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IconHeart size={22} />
        </button>
        {calUrl ? (
          <a href={calUrl} target="_blank" rel="noopener noreferrer" className="nm-press" style={primaryAction}>Add to calendar</a>
        ) : infoUrl ? (
          <a href={infoUrl} target="_blank" rel="noopener noreferrer" className="nm-press" style={primaryAction}>More info</a>
        ) : (
          <div style={{ ...primaryAction, background: "var(--nm-surface2)", color: "var(--nm-muted)", cursor: "default", font: "500 13.5px var(--nm-font-text)" }}>Details coming soon</div>
        )}
      </div>
      {calUrl && infoUrl && (
        <a href={infoUrl} target="_blank" rel="noopener noreferrer" className="nm-press" style={{ display: "block", textAlign: "center", marginTop: 12, textDecoration: "none", color: "var(--nm-accent)", font: "600 13.5px var(--nm-font-text)" }}>View event page →</a>
      )}
    </div>
  );
}

const filterInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};

const primaryAction: React.CSSProperties = {
  flex: 1, textAlign: "center", textDecoration: "none", height: 54, boxSizing: "border-box",
  borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px var(--nm-font-text)",
};
