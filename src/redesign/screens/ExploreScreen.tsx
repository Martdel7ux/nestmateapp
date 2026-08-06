import { useState, useEffect, useRef } from "react";
import { useData } from "@/contexts/data-context";
import { useOpportunities } from "@/hooks/use-opportunities";
import { useMatchScore } from "@/hooks/use-match-score";
import { ModuleIcon, IconArrowLeft, IconChevron, IconHeart, IconClose, IconCheck, type ModuleIconName } from "../icons";
import { initialsOf } from "../util";
import { SocietiesBody, MarketBody, PerksBody } from "./CommunityScreen";
import { BillsBody } from "./BillsScreen";
import { CampusBody } from "./CampusScreen";
import { EventsBody } from "./EventsScreen";
import { MoveBody } from "./RelocationScreen";
import { RoommateProfileForm } from "./RoommateProfileForm";
import { RoommateDetail } from "./RoommateDetail";
import { PropertyDetail } from "./PropertyDetail";
import { JobDetail, salaryLabel } from "./JobDetail";
import { RangeSlider } from "../RangeSlider";
import { stickyControl } from "../StickyBar";
import { cities } from "@/lib/constants";
import { CITY_AREAS } from "@/lib/cyprus-areas";
import type { Property } from "@/types/supabase";
import type { Opportunity } from "@/types/discover";

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
  { id: "deals", label: "Discounts", note: "Student offers" },
  { id: "move", label: "Relocation plan", note: "Arrival checklist" },
  { id: "ai", label: "AI assistant", note: "Ask anything" },
];

// Cohesive jewel-tone gradient per module, tuned so white text stays legible.
const MODULE_THEME: Record<ModuleId, { gradient: string; shadow: string }> = {
  discover:  { gradient: "linear-gradient(145deg,#5B54E6,#7B6FF0)", shadow: "0 12px 26px -10px rgba(79,70,229,.5)" },
  matches:   { gradient: "linear-gradient(145deg,#FB6F63,#FF8A6B)", shadow: "0 12px 26px -10px rgba(251,111,99,.5)" },
  bills:     { gradient: "linear-gradient(145deg,#059669,#10B981)", shadow: "0 12px 26px -10px rgba(5,150,105,.5)" },
  jobs:      { gradient: "linear-gradient(145deg,#2563EB,#3B82F6)", shadow: "0 12px 26px -10px rgba(37,99,235,.5)" },
  events:    { gradient: "linear-gradient(145deg,#9333EA,#B15CF7)", shadow: "0 12px 26px -10px rgba(147,51,234,.5)" },
  community: { gradient: "linear-gradient(145deg,#4F46E5,#6D63F0)", shadow: "0 12px 26px -10px rgba(79,70,229,.5)" },
  campus:    { gradient: "linear-gradient(145deg,#0E7490,#0EA5C4)", shadow: "0 12px 26px -10px rgba(14,116,144,.5)" },
  market:    { gradient: "linear-gradient(145deg,#EA8C0A,#F97316)", shadow: "0 12px 26px -10px rgba(234,140,10,.5)" },
  deals:     { gradient: "linear-gradient(145deg,#DB2777,#EC4899)", shadow: "0 12px 26px -10px rgba(219,39,119,.5)" },
  move:      { gradient: "linear-gradient(145deg,#0D9488,#16B8A6)", shadow: "0 12px 26px -10px rgba(13,148,136,.5)" },
  ai:        { gradient: "linear-gradient(145deg,#4F46E5,#7C3AED)", shadow: "0 12px 26px -10px rgba(124,58,237,.5)" },
};

function SubHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>{subtitle}</div>}
    </>
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

/** Accommodation — real properties with filters, save & detail view. */
function DiscoverBody({ focusId }: { focusId?: string }) {
  const { filteredProperties, propertyFilters, setPropertyFilters, toggleSavedProperty, snapshot } = useData();
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Property | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const focusedRef = useRef<string | null>(null);
  const savedIds = new Set((snapshot.savedProperties ?? []).map((p) => p.id));

  // Deep-link from Home: open a specific property's detail (once) when it loads.
  useEffect(() => {
    if (!focusId || focusedRef.current === focusId) return;
    const pool = [...(filteredProperties ?? []), ...(snapshot.featuredProperties ?? []), ...(snapshot.savedProperties ?? [])];
    const found = pool.find((p) => p.id === focusId);
    if (found) { focusedRef.current = focusId; setDetail(found); }
  }, [focusId, filteredProperties, snapshot.featuredProperties, snapshot.savedProperties]);

  if (detail) {
    return <PropertyDetail property={detail} saved={savedIds.has(detail.id)} onBack={() => setDetail(null)} onToggleSave={() => toggleSavedProperty(detail)} />;
  }

  const homes = filteredProperties.filter(
    (p) => areas.length === 0 || areas.some((a) => (p.address ?? "").toLowerCase().includes(a.toLowerCase())),
  );
  const activeCount =
    (propertyFilters.city ? 1 : 0) + (propertyFilters.bedrooms ? 1 : 0) + areas.length +
    (propertyFilters.minPrice || propertyFilters.maxPrice ? 1 : 0);
  const patch = (p: Partial<typeof propertyFilters>) => setPropertyFilters({ ...propertyFilters, ...p });

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>{homes.length} verified home{homes.length === 1 ? "" : "s"} for you</div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => setShowFilters((v) => !v)} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: activeCount > 0 || showFilters ? "var(--nm-soft)" : "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: activeCount > 0 || showFilters ? "var(--nm-accent)" : "var(--nm-text)", font: "600 12.5px var(--nm-font-text)" }}>
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={() => { setPropertyFilters({}); setAreas([]); }} style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 99, color: "var(--nm-muted)", font: "600 12.5px var(--nm-font-text)" }}>Clear</button>
        )}
      </div>

      {showFilters && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 12, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <select style={filterSelect} value={propertyFilters.city ?? ""} onChange={(e) => { patch({ city: (e.target.value || undefined) as typeof propertyFilters.city }); setAreas([]); }}>
              <option value="">Any city</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={filterSelect} value={propertyFilters.bedrooms ?? ""} onChange={(e) => patch({ bedrooms: Number(e.target.value) || undefined })}>
              <option value="">Any beds</option>
              {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ bed</option>)}
            </select>
          </div>

          {propertyFilters.city && CITY_AREAS[propertyFilters.city] && (
            <div>
              <div className="nm-section-label" style={{ fontSize: 11, marginBottom: 8 }}>Areas in {propertyFilters.city}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {CITY_AREAS[propertyFilters.city].map((a) => {
                  const on = areas.includes(a);
                  return (
                    <button key={a} type="button" onClick={() => setAreas((cur) => on ? cur.filter((x) => x !== a) : [...cur, a])} style={{ all: "unset", cursor: "pointer", padding: "6px 12px", borderRadius: 99, font: "500 12px var(--nm-font-text)", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}>{a}</button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="nm-section-label" style={{ fontSize: 11, marginBottom: 4 }}>Monthly budget</div>
            <RangeSlider
              floor={0} ceil={2000} step={50}
              minVal={propertyFilters.minPrice ?? 0}
              maxVal={propertyFilters.maxPrice ?? 2000}
              format={(v) => `€${v}`}
              onChange={(min, max) => patch({ minPrice: min > 0 ? min : undefined, maxPrice: max < 2000 ? max : undefined })}
            />
          </div>
        </div>
      )}

      {homes.length === 0 ? (
        <EmptyNote text={activeCount > 0 ? "No homes match these filters. Try widening them." : "No verified homes to show right now — check back soon."} />
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {homes.map((h) => {
            const isSaved = savedIds.has(h.id);
            return (
              <button key={h.id} type="button" onClick={() => setDetail(h)} className="nm-card nm-press" style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", background: "var(--nm-surface)", borderRadius: "var(--nm-r-lg)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
                <span style={{ display: "block", height: 186, position: "relative", background: "var(--nm-surface2)" }}>
                  {h.image_urls?.[0] && <img src={h.image_urls[0]} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  <span style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                    {h.average_rating != null && <span style={{ padding: "5px 9px", borderRadius: 99, background: "rgba(17,24,39,.62)", color: "#fff", font: "600 10.5px var(--nm-font-text)", backdropFilter: "blur(6px)" }}>★ {h.average_rating.toFixed(1)}</span>}
                    {h.is_approved && <span style={{ padding: "5px 9px", borderRadius: 99, background: "rgba(52,211,153,.92)", color: "#08281f", font: "600 10.5px var(--nm-font-text)" }}>Verified</span>}
                  </span>
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => { e.stopPropagation(); toggleSavedProperty(h); }}
                    style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 99, background: "rgba(17,24,39,.5)", backdropFilter: "blur(6px)", color: isSaved ? "var(--nm-coral)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <IconHeart size={17} />
                  </span>
                </span>
                <span style={{ display: "block", padding: "16px 17px 17px" }}>
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>€{h.rent_price} / mo</span>
                    <span style={{ fontSize: 12.5, color: "var(--nm-muted)" }}>{h.available_to === "erasmus" ? "Erasmus" : "Full-time"}</span>
                  </span>
                  <span style={{ display: "block", fontSize: 13.5, color: "var(--nm-muted)", marginTop: 4 }}>{h.city} · {h.title}</span>
                  <span style={{ display: "flex", gap: 7, marginTop: 13, flexWrap: "wrap" }}>
                    {[`${h.bedrooms} bed`, `${h.bathrooms} bath`].map((s) => <span key={s} style={{ padding: "6px 10px", borderRadius: 10, background: "var(--nm-surface2)", font: "500 11.5px var(--nm-font-text)", color: "var(--nm-muted)" }}>{s}</span>)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Jobs & internships — real opportunities with filters & detail view. */
function JobsBody() {
  const [kind, setKind] = useState<"job" | "internship">("job");
  const [locType, setLocType] = useState<"" | "in_person" | "remote" | "hybrid">("");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Opportunity | null>(null);

  const { data, isLoading } = useOpportunities({
    type: kind,
    location_type: locType || undefined,
    query: query.trim() || undefined,
  });
  const jobs = (data?.pages.flat() ?? []).slice(0, 30);

  if (detail) return <JobDetail job={detail} onBack={() => setDetail(null)} />;

  const activeCount = [locType, query.trim()].filter(Boolean).length;

  return (
    <div style={{ marginTop: 16 }}>
      {/* Kind toggle */}
      <div style={{ display: "flex", gap: 8, padding: 4, borderRadius: 99, background: "var(--nm-surface2)" }}>
        {([["job", "Jobs"], ["internship", "Internships"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)} className="nm-press" style={{ all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 99, font: "600 13px var(--nm-font-text)", background: kind === k ? "var(--nm-surface)" : "transparent", color: kind === k ? "var(--nm-text)" : "var(--nm-muted)", boxShadow: kind === k ? "var(--nm-elev)" : "none" }}>{label}</button>
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
          <input style={{ ...filterSelect, flex: "none" }} type="text" placeholder="Search by title…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div>
            <div className="nm-section-label" style={{ fontSize: 11, marginBottom: 8 }}>Work style</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {([["", "Any"], ["in_person", "On-site"], ["remote", "Remote"], ["hybrid", "Hybrid"]] as const).map(([v, label]) => {
                const on = locType === v;
                return (
                  <button key={v || "any"} type="button" onClick={() => setLocType(v)} style={{ all: "unset", cursor: "pointer", padding: "6px 12px", borderRadius: 99, font: "500 12px var(--nm-font-text)", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}>{label}</button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyNote text={isLoading ? "Loading roles…" : activeCount > 0 ? "No roles match these filters. Try widening them." : kind === "internship" ? "No internships posted yet — check back soon." : "No graduate roles posted yet — check back soon."} />
      ) : (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map((j) => {
            const salary = salaryLabel(j);
            return (
              <button key={j.id} type="button" onClick={() => setDetail(j)} className="nm-card nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", gap: 13, alignItems: "center", padding: "15px 16px", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)" }}>
                <span style={{ width: 44, height: 44, flex: "none", borderRadius: 12, overflow: "hidden", background: "var(--nm-surface2)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--nm-font-text)", color: "var(--nm-muted)" }}>
                  {j.image_url ? <img src={j.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (j.organization ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.title}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{[j.organization, j.location ?? (j.location_type === "remote" ? "Remote" : "Cyprus"), salary].filter(Boolean).join(" · ")}</span>
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

const filterSelect: React.CSSProperties = {
  flex: 1, boxSizing: "border-box", padding: "10px 12px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};

/** Roommates — real flatmate swipe deck with filters, detail view & match score. */
function RoommatesBody() {
  const { myFlatmateListing, filteredFlatmates, swipeFlatmate, flatmateFilters, setFlatmateFilters } = useData();
  const [idx, setIdx] = useState(0);
  const [matched, setMatched] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [rmAreas, setRmAreas] = useState<string[]>([]);
  const deck = filteredFlatmates.filter(
    (fm) => rmAreas.length === 0 || rmAreas.some((a) => (fm.flat_area ?? "").toLowerCase().includes(a.toLowerCase())),
  );
  const current = deck[idx];
  const match = useMatchScore(current);

  // Gate: you must have a roommate profile before you can browse others.
  if (!myFlatmateListing) return <RoommateProfileForm />;

  const doSwipe = (dir: "left" | "right") => {
    if (!current) return;
    const m = swipeFlatmate(current.id, dir);
    if (m) setMatched(current.profile?.full_name ?? "them");
    setIdx((i) => i + 1);
    setShowDetail(false);
  };

  if (showDetail && current) {
    return <RoommateDetail flatmate={current} match={match} onBack={() => setShowDetail(false)} onSwipe={doSwipe} />;
  }

  const activeCount = [flatmateFilters.city, flatmateFilters.studentType, flatmateFilters.maxBudget].filter(Boolean).length + rmAreas.length;
  const patch = (p: Partial<typeof flatmateFilters>) => setFlatmateFilters({ ...flatmateFilters, ...p });
  const seeking = myFlatmateListing.housing_status === "seeking_flat";

  const name = current?.profile?.full_name ?? "Student";
  const photo = current && (current.housing_status === "has_flat"
    ? (current.apartment_images?.[0] ?? current.profile_image_url ?? current.profile?.avatar_url ?? null)
    : (current.profile_image_url ?? current.profile?.avatar_url ?? null));
  const tags = current ? [current.country_of_origin, current.language, current.student_type === "erasmus" ? "Erasmus" : "Full-time"].filter(Boolean) as string[] : [];
  const budget = current && (current.housing_status === "has_flat" && current.flat_price
    ? `€${current.flat_price}/mo`
    : current.min_budget && current.max_budget ? `€${current.min_budget}–${current.max_budget}` : null);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => setShowFilters((v) => !v)} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 99, background: activeCount > 0 || showFilters ? "var(--nm-soft)" : "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: activeCount > 0 || showFilters ? "var(--nm-accent)" : "var(--nm-text)", font: "600 12.5px var(--nm-font-text)" }}>
          Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={() => { setFlatmateFilters({}); setRmAreas([]); }} style={{ all: "unset", cursor: "pointer", padding: "8px 14px", borderRadius: 99, color: "var(--nm-muted)", font: "600 12.5px var(--nm-font-text)" }}>Clear</button>
        )}
      </div>

      {showFilters && (
        <div className="nm-card nm-card-lg" style={{ marginTop: 12, padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <select style={filterSelect} value={flatmateFilters.city ?? ""} onChange={(e) => { patch({ city: e.target.value || undefined }); setRmAreas([]); }}>
              <option value="">Any city</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={filterSelect} value={flatmateFilters.studentType ?? ""} onChange={(e) => patch({ studentType: e.target.value || undefined })}>
              <option value="">Any type</option>
              <option value="full_time">Full-time</option>
              <option value="erasmus">Erasmus</option>
            </select>
          </div>

          {seeking && flatmateFilters.city && CITY_AREAS[flatmateFilters.city] && (
            <div>
              <div className="nm-section-label" style={{ fontSize: 11, marginBottom: 8 }}>Areas in {flatmateFilters.city}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {CITY_AREAS[flatmateFilters.city].map((a) => {
                  const on = rmAreas.includes(a);
                  return (
                    <button key={a} type="button" onClick={() => setRmAreas((cur) => on ? cur.filter((x) => x !== a) : [...cur, a])} style={{ all: "unset", cursor: "pointer", padding: "6px 12px", borderRadius: 99, font: "500 12px var(--nm-font-text)", background: on ? "var(--nm-accent)" : "var(--nm-surface2)", color: on ? "#fff" : "var(--nm-muted)" }}>{a}</button>
                  );
                })}
              </div>
            </div>
          )}

          <input style={{ ...filterSelect, flex: "none" }} type="number" placeholder="Max budget (€)" value={flatmateFilters.maxBudget ?? ""} onChange={(e) => patch({ maxBudget: Number(e.target.value) || undefined })} />
        </div>
      )}

      {matched && (
        <div className="nm-card" style={{ padding: "12px 15px", marginTop: 12, background: "var(--nm-mint-soft)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--nm-mint)" }}><IconCheck /></span>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>It's a match with {matched}! Say hello in Messages.</span>
        </div>
      )}

      {!current ? (
        <EmptyNote text={activeCount > 0 ? "No roommates match these filters. Try clearing some." : "No more roommates to show right now — check back as more students join."} />
      ) : (
        <div style={{ marginTop: 14 }}>
          <button type="button" onClick={() => setShowDetail(true)} className="nm-card nm-press" style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", boxShadow: "var(--nm-elev)", overflow: "hidden" }}>
            <span style={{ display: "block", height: 380, position: "relative", background: "var(--nm-surface2)" }}>
              {photo
                ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-muted)", font: "600 48px var(--nm-font-text)" }}>{initialsOf(name)}</span>}
              {match && match.dimensions.length > 0 && (
                <span style={{ position: "absolute", top: 12, left: 12, padding: "5px 11px", borderRadius: 99, background: "rgba(17,24,39,.62)", color: "#fff", font: "700 12px var(--nm-font-text)", backdropFilter: "blur(6px)" }}>{match.overall}% match</span>
              )}
              <span style={{ position: "absolute", top: 12, right: 12, padding: "5px 11px", borderRadius: 99, background: "rgba(17,24,39,.5)", color: "#fff", font: "500 11px var(--nm-font-text)", backdropFilter: "blur(6px)" }}>Tap for details</span>
              <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.1) 45%, transparent)" }} />
              <span style={{ position: "absolute", left: 16, right: 16, bottom: 16, color: "#fff" }}>
                <span style={{ display: "block", fontFamily: "var(--nm-font-display)", fontSize: 24, fontWeight: 700, letterSpacing: "-.02em" }}>{name}</span>
                <span style={{ display: "block", fontSize: 13, opacity: 0.85, marginTop: 2 }}>{[current.preferred_city, budget].filter(Boolean).join(" · ")}</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {tags.map((t) => <span key={t} style={{ padding: "5px 10px", borderRadius: 99, background: "rgba(255,255,255,.18)", font: "500 11.5px var(--nm-font-text)" }}>{t}</span>)}
                </span>
              </span>
            </span>
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 18 }}>
            <button type="button" onClick={() => doSwipe("left")} aria-label="Pass" className="nm-press" style={{ all: "unset", cursor: "pointer", width: 60, height: 60, borderRadius: 99, background: "var(--nm-surface)", boxShadow: "var(--nm-elev)", color: "var(--nm-coral)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconClose size={26} />
            </button>
            <button type="button" onClick={() => doSwipe("right")} aria-label="Like" className="nm-press" style={{ all: "unset", cursor: "pointer", width: 60, height: 60, borderRadius: 99, background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconHeart size={26} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function SubBody({ id, focus }: { id: ModuleId; focus?: string }) {
  if (id === "discover") return <DiscoverBody focusId={focus} />;
  if (id === "matches") return <RoommatesBody />;
  if (id === "jobs") return <JobsBody />;
  if (id === "bills") return <BillsBody />;
  if (id === "campus") return <CampusBody />;
  if (id === "events") return <EventsBody />;
  if (id === "move") return <MoveBody />;
  if (id === "community") return <SocietiesBody />;
  if (id === "market") return <MarketBody />;
  if (id === "deals") return <PerksBody />;
  return (
    <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
      <span className="nm-pill">Coming soon</span>
      <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>
        This section is part of the redesign in progress.
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

export function ExploreScreen({ target }: { target?: { module: ModuleId; token: number; focus?: string } | null }) {
  const [view, setView] = useState<"hub" | ModuleId>(target?.module ?? "hub");
  const [focus, setFocus] = useState<string | undefined>(target?.focus);

  // Deep-link from Home: open the requested module (and any focused item) on a new target.
  useEffect(() => {
    if (target?.module) { setView(target.module); setFocus(target.focus); }
  }, [target?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual navigation within Explore clears any deep-link focus.
  const openModule = (id: ModuleId) => { setFocus(undefined); setView(id); };

  if (view !== "hub") {
    const meta = SUB_META[view];
    return (
      <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .3s ease-out" }}>
        <SubHeader title={meta.title} subtitle={meta.subtitle} onBack={() => { setFocus(undefined); setView("hub"); }} />
        <SubBody id={view} focus={focus} />
        <div style={{ height: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Explore</div>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 8 }}>Everything NestMate does, in one place.</div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {MODULES.map((m) => {
          const t = MODULE_THEME[m.id];
          return (
            <button
              key={m.id}
              type="button"
              className="nm-press"
              onClick={() => openModule(m.id)}
              style={{ all: "unset", cursor: "pointer", position: "relative", overflow: "hidden", background: t.gradient, borderRadius: 20, padding: 15, minHeight: 128, boxSizing: "border-box", display: "flex", flexDirection: "column", boxShadow: t.shadow }}
            >
              <span aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 112, height: 112, borderRadius: 99, background: "radial-gradient(circle, rgba(255,255,255,.32), rgba(255,255,255,0) 70%)" }} />
              <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 20, boxShadow: "inset 0 1px 0 rgba(255,255,255,.28)" }} />
              <span style={{ position: "relative", width: 40, height: 40, borderRadius: 13, background: "rgba(255,255,255,.22)", border: "1px solid rgba(255,255,255,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <ModuleIcon name={m.id} size={20} />
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ position: "relative", display: "block", fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "#fff", marginTop: 12, lineHeight: 1.2 }}>{m.label}</span>
              <span style={{ position: "relative", display: "block", fontSize: 11.5, color: "rgba(255,255,255,.82)", marginTop: 4, lineHeight: 1.35 }}>{m.note}</span>
            </button>
          );
        })}
      </div>

      <div style={{ height: 12 }} />
    </div>
  );
}
