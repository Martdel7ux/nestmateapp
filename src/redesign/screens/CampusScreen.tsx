import { useState } from "react";
import { useData } from "@/contexts/data-context";
import { ModuleIcon, IconArrowLeft, IconChevron, IconCheck, type ModuleIconName } from "../icons";
import { stickyControl } from "../StickyBar";

interface CampusService {
  id: string;
  icon: ModuleIconName;
  name: string;
  tagline: string;
  about: string;
  offerings: string[];
  hours: string;
  tip?: string;
  /** Search term appended to the university name for the Maps link. */
  mapsQuery: string;
}

const SERVICES: CampusService[] = [
  {
    id: "library",
    icon: "campus",
    name: "Library",
    tagline: "Opening hours, study rooms & printing",
    about: "Your main hub for study space, books and printing. Bookable rooms fill up fast around exams — reserve ahead.",
    offerings: [
      "Silent and group study zones",
      "Bookable study rooms (via the library portal)",
      "Printing, scanning & photocopying",
      "Access to online journals & databases",
      "Laptop and charger loans",
    ],
    hours: "Mon–Fri 8:00–22:00 · Sat 9:00–17:00 (extended during exams)",
    tip: "Bring your student card — it doubles as your printing and door-access pass.",
    mapsQuery: "library",
  },
  {
    id: "sports",
    icon: "community",
    name: "Sports & gym",
    tagline: "Membership, classes & teams",
    about: "Gym, courts and fitness classes, plus student teams you can join at any level.",
    offerings: [
      "Discounted student gym membership",
      "Group classes (yoga, spin, HIIT)",
      "Football, basketball & tennis courts",
      "Intramural leagues and university teams",
    ],
    hours: "Mon–Fri 7:00–22:00 · Weekends 9:00–18:00",
    tip: "Most classes are free with membership but need booking a day ahead.",
    mapsQuery: "sports centre gym",
  },
  {
    id: "health",
    icon: "matches",
    name: "Health & wellbeing",
    tagline: "GP, counselling & pharmacy",
    about: "Confidential medical care and mental-health support for students, usually free or low-cost.",
    offerings: [
      "General practitioner appointments",
      "Free, confidential counselling sessions",
      "Sexual health & vaccinations",
      "Referrals to specialists",
    ],
    hours: "Mon–Fri 9:00–17:00 · Drop-in for urgent needs",
    tip: "Counselling has waitlists — book early rather than waiting for a crisis.",
    mapsQuery: "health centre",
  },
  {
    id: "careers",
    icon: "jobs",
    name: "Careers service",
    tagline: "CV help, fairs & placements",
    about: "One-to-one advice, employer events and placement listings to launch your career.",
    offerings: [
      "CV and cover-letter reviews",
      "Mock interviews & assessment-centre prep",
      "Career fairs and employer talks",
      "Internship & graduate-role listings",
    ],
    hours: "Mon–Fri 9:00–17:00 · Book appointments online",
    tip: "Pair this with the Jobs tab — bring a listing you like to your CV review.",
    mapsQuery: "careers service",
  },
  {
    id: "it",
    icon: "ai",
    name: "IT & WiFi support",
    tagline: "Email, eduroam & software",
    about: "Get connected to campus WiFi, set up your student email and access free software.",
    offerings: [
      "eduroam WiFi setup (works at unis worldwide)",
      "Student email & Microsoft/Google account help",
      "Free & discounted software licences",
      "Password resets and account recovery",
    ],
    hours: "Mon–Fri 8:30–17:30 · Online tickets 24/7",
    tip: "Connect to eduroam once here and your phone auto-joins on any partner campus.",
    mapsQuery: "IT service desk",
  },
  {
    id: "international",
    icon: "move",
    name: "International & Erasmus office",
    tagline: "Visa, residence permit & orientation",
    about: "Support for international and Erasmus students — the people to see for paperwork and settling in.",
    offerings: [
      "Residence-permit & visa guidance",
      "Erasmus learning agreements & grants",
      "Orientation events and buddy schemes",
      "Letters for banks, migration & housing",
    ],
    hours: "Mon–Fri 9:00–16:00",
    tip: "Sort your residence permit within your first weeks — see the Relocation plan for the checklist.",
    mapsQuery: "international office",
  },
  {
    id: "union",
    icon: "community",
    name: "Student union",
    tagline: "Societies, events & representation",
    about: "Clubs and societies, social events, and the team that represents students to the university.",
    offerings: [
      "Join or start a society",
      "Social, cultural & sport events",
      "Academic representation & advice",
      "Volunteering opportunities",
    ],
    hours: "Mon–Fri 10:00–18:00",
    tip: "Browse the Communities tab to find country and interest groups too.",
    mapsQuery: "student union",
  },
  {
    id: "finance",
    icon: "bills",
    name: "Fees & finance office",
    tagline: "Tuition, payments & receipts",
    about: "Handle tuition payments, instalment plans and official receipts for scholarships or visas.",
    offerings: [
      "Tuition payment & instalment plans",
      "Official payment receipts & letters",
      "Scholarship & bursary queries",
      "Refunds and account statements",
    ],
    hours: "Mon–Fri 9:00–15:00",
    tip: "Ask for a stamped receipt — you'll often need it for your residence permit.",
    mapsQuery: "finance office",
  },
];

export function CampusBody() {
  const { snapshot } = useData();
  const university = snapshot.profile?.university?.trim() || null;
  const [detail, setDetail] = useState<CampusService | null>(null);

  if (detail) return <CampusServiceDetail service={detail} university={university} onBack={() => setDetail(null)} />;

  return (
    <div style={{ marginTop: 16 }}>
      {university && (
        <div className="nm-card" style={{ padding: "13px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 11, background: "var(--nm-soft)", boxShadow: "none" }}>
          <span style={{ width: 34, height: 34, flex: "none", borderRadius: 10, background: "var(--nm-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
            <ModuleIcon name="campus" size={17} />
          </span>
          <span style={{ fontSize: 13, color: "var(--nm-accent)", fontWeight: 600 }}>Services at {university}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {SERVICES.map((c) => (
          <button key={c.id} type="button" onClick={() => setDetail(c)} className="nm-card nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
            <span style={{ width: 38, height: 38, flex: "none", borderRadius: 13, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
              <ModuleIcon name={c.icon} size={19} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.tagline}</span>
            </span>
            <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CampusServiceDetail({ service, university, onBack }: { service: CampusService; university: string | null; onBack: () => void }) {
  const mapsQuery = encodeURIComponent([university, service.mapsQuery, university ? "" : "Cyprus"].filter(Boolean).join(" "));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div style={{ paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      <button type="button" onClick={onBack} aria-label="Back" className="nm-icon-btn nm-press" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 52, height: 52, flex: "none", borderRadius: 16, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
          <ModuleIcon name={service.icon} size={26} />
        </span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{service.name}</div>
          <div style={{ fontSize: 13, color: "var(--nm-muted)", marginTop: 2 }}>{service.tagline}</div>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6 }}>{service.about}</p>

      {/* Hours */}
      <div className="nm-card" style={{ padding: "13px 16px", marginTop: 16, display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ fontSize: 18 }}>🕒</span>
        <span style={{ fontSize: 13, color: "var(--nm-text)", lineHeight: 1.4 }}>{service.hours}</span>
      </div>

      {/* Offerings */}
      <div style={{ marginTop: 18 }}>
        <div className="nm-section-label" style={{ marginBottom: 10 }}>What's here</div>
        <div className="nm-card nm-card-lg" style={{ padding: "6px 4px" }}>
          {service.offerings.map((o, i) => (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderTop: i === 0 ? "none" : "1px solid var(--nm-line)" }}>
              <span style={{ width: 22, height: 22, flex: "none", borderRadius: 99, background: "var(--nm-mint-soft)", color: "#0b7a5a", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCheck size={13} /></span>
              <span style={{ fontSize: 13.5 }}>{o}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      {service.tip && (
        <div className="nm-card" style={{ padding: "14px 16px", marginTop: 16, background: "var(--nm-soft)", boxShadow: "none", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 13, color: "var(--nm-accent)", lineHeight: 1.5 }}>{service.tip}</span>
        </div>
      )}

      {/* Action */}
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="nm-press" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, height: 52, borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", textDecoration: "none", font: "600 14.5px Inter, sans-serif" }}>
        📍 Find on the map
      </a>
      {!university && (
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--nm-muted)", textAlign: "center", lineHeight: 1.5 }}>Add your university in your profile for exact locations and hours.</p>
      )}
    </div>
  );
}
