import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { IconArrowLeft, IconCheck, IconChevron } from "../icons";
import { stickyControl } from "../StickyBar";

type Phase = "before" | "week1" | "month1";

interface MoveTask {
  id: string;
  phase: Phase;
  title: string;
  short: string;
  about: string;
  steps: string[];
  tip?: string;
  /** Search term for the "Learn more" link (official info via web search). */
  search?: string;
}

const PHASES: { id: Phase; label: string; note: string }[] = [
  { id: "before", label: "Before you arrive", note: "Sort these from home" },
  { id: "week1", label: "First week", note: "Your first days in Cyprus" },
  { id: "month1", label: "First month", note: "Settle in properly" },
];

const TASKS: MoveTask[] = [
  {
    id: "accommodation", phase: "before", title: "Confirm your accommodation",
    short: "Lock in where you'll live",
    about: "Have somewhere to stay from day one — even if it's temporary. Landlords in Cyprus often ask for a deposit plus first month's rent up front.",
    steps: [
      "Browse verified homes in the Accommodation tab",
      "Agree the rent, deposit and move-in date in writing",
      "Save the landlord's contact and the exact address",
      "Ask whether bills (water, electricity, internet) are included",
    ],
    tip: "No permanent place yet? Book a hostel or short-let for your first week and view flats in person.",
    search: "student accommodation Cyprus",
  },
  {
    id: "pickup", phase: "before", title: "Arrange arrival transport",
    short: "Get from the airport to your door",
    about: "Cyprus has two airports — Larnaca (LCA) and Paphos (PFO). There's no train, so plan your transfer before you land.",
    steps: [
      "Check which airport you're flying into",
      "Pre-book a shuttle, taxi, or intercity bus",
      "Share your arrival time with your landlord or a flatmate",
      "Have some euros in cash for the first day",
    ],
    tip: "Intercity buses (Kapnos, Limassol Airport Express) are the cheapest airport option.",
    search: "Larnaca airport transfer to Nicosia",
  },
  {
    id: "documents", phase: "before", title: "Pack your key documents",
    short: "Passport, acceptance letter & photos",
    about: "You'll need original documents to enrol, register with Migration, and open a bank account. Bring physical copies — not just photos on your phone.",
    steps: [
      "Passport / ID valid for your whole stay",
      "University acceptance / registration letter",
      "Several passport-size photos",
      "Proof of health insurance",
      "Birth certificate (apostilled if non-EU)",
    ],
    tip: "Keep scanned copies in cloud storage in case anything is lost.",
  },
  {
    id: "enrol", phase: "week1", title: "Enrol at your university",
    short: "Register and get your student card",
    about: "Registration confirms your student status — which you need for your residence permit, transport discounts and campus access.",
    steps: [
      "Attend orientation / registration week",
      "Submit your documents to the admissions office",
      "Collect your student ID card",
      "Activate your student email and portal login",
    ],
    tip: "Your student card unlocks library, printing and gym access — see the Campus services tab.",
    search: "university enrolment Cyprus international students",
  },
  {
    id: "residence", phase: "week1", title: "Apply for your residence permit",
    short: "Register with the Migration Department",
    about: "Non-EU students must apply for a temporary residence permit soon after arriving. EU students register for a certificate. Deadlines are tight — don't leave it.",
    steps: [
      "Visit the university's international office first",
      "Gather passport, photos, acceptance letter & insurance",
      "Book an appointment with the Migration Department",
      "Keep the stamped receipt they give you",
    ],
    tip: "The International & Erasmus office (Campus services) does this every year — let them guide you.",
    search: "Cyprus residence permit students migration department",
  },
  {
    id: "sim", phase: "week1", title: "Get a local SIM card",
    short: "A Cyprus number for banks & apps",
    about: "A local number makes banking, food delivery and university logins far easier. Prepaid SIMs are cheap and need no contract.",
    steps: [
      "Pick a provider: Cyta, Epic or PrimeTel",
      "Bring your passport to register the SIM",
      "Top up and add a data bundle",
      "Save your new number where you'll remember it",
    ],
    tip: "Most providers have a student data plan — ask at the shop.",
    search: "best prepaid SIM Cyprus students",
  },
  {
    id: "bank", phase: "week1", title: "Open a Cyprus bank account",
    short: "For rent, wages & everyday spending",
    about: "A local account helps you pay rent, receive any wages, and avoid foreign-card fees. You'll usually need proof of address and your student registration.",
    steps: [
      "Choose a bank (Bank of Cyprus, Hellenic, Alpha)",
      "Bring passport, student proof and proof of address",
      "Ask about free student accounts",
      "Set up mobile banking and Revolut for splitting costs",
    ],
    tip: "Many students use Revolut day-to-day and a local account just for rent.",
    search: "student bank account Cyprus how to open",
  },
  {
    id: "rent-bills", phase: "month1", title: "Set up rent & shared bills",
    short: "Track payments and split costs",
    about: "Get your rent schedule and shared bills organised so nothing is missed and everyone pays their share.",
    steps: [
      "Add your rent agreement in the Rent & bills tab",
      "Note your monthly due date and set a reminder",
      "Agree how flatmates split water, electricity & internet",
      "Use the bill splitter for shared costs",
    ],
    tip: "The Rent & bills tab tracks due dates, marks payments paid and splits bills for you.",
  },
  {
    id: "healthcare", phase: "month1", title: "Sort your healthcare",
    short: "Register and know where to go",
    about: "Make sure you're covered and know your options before you need them — from the campus health centre to the national system where eligible.",
    steps: [
      "Confirm your insurance covers your whole stay",
      "Find your nearest clinic and pharmacy",
      "Register with the campus health centre",
      "Save the emergency number: 112",
    ],
    tip: "The campus Health & wellbeing service offers a GP and free counselling — see Campus services.",
    search: "healthcare for international students Cyprus GeSY",
  },
  {
    id: "connect", phase: "month1", title: "Build your circle",
    short: "Meet people & join in",
    about: "Settling in socially matters as much as the paperwork. Join societies, find your country's community, and get to events early on.",
    steps: [
      "Find your country or interest group in Communities",
      "Save a few events happening in your first weeks",
      "Join a society or sports team on campus",
      "Introduce yourself to flatmates and neighbours",
    ],
    tip: "Check the Events and Communities tabs — arriving students often connect there before term starts.",
  },
];

function loadDone(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function MoveBody() {
  const { user } = useAuth();
  const storageKey = `nm-relocation-${user?.id ?? "guest"}`;
  const [done, setDone] = useState<Set<string>>(() => loadDone(storageKey));
  const [detailId, setDetailId] = useState<string | null>(null);

  // Reload when the user (and thus the key) changes.
  useEffect(() => { setDone(loadDone(storageKey)); }, [storageKey]);

  const toggle = (id: string) => {
    setDone((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const detail = detailId ? TASKS.find((t) => t.id === detailId) ?? null : null;
  if (detail) {
    return <RelocationTaskDetail task={detail} done={done.has(detail.id)} onToggle={() => toggle(detail.id)} onBack={() => setDetailId(null)} />;
  }

  const count = done.size;
  const pct = Math.round((count / TASKS.length) * 100);

  return (
    <div style={{ marginTop: 16 }}>
      {/* Progress */}
      <div className="nm-card nm-card-lg" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Your arrival plan</div>
          <div style={{ fontSize: 12.5, color: "var(--nm-muted)" }}>{count} of {TASKS.length} done</div>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "var(--nm-surface2)", marginTop: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: pct === 100 ? "var(--nm-mint)" : "var(--nm-accent)", width: `${pct}%`, transition: "width .4s" }} />
        </div>
        {pct === 100 && <div style={{ fontSize: 12.5, color: "#0b7a5a", fontWeight: 600, marginTop: 10 }}>All set — welcome to Cyprus 🎉</div>}
      </div>

      {/* Phases */}
      {PHASES.map((phase) => {
        const tasks = TASKS.filter((t) => t.phase === phase.id);
        const phaseDone = tasks.filter((t) => done.has(t.id)).length;
        return (
          <div key={phase.id} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div className="nm-section-label">{phase.label}</div>
                <div style={{ fontSize: 12, color: "var(--nm-muted)", marginTop: 3 }}>{phase.note}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--nm-muted)" }}>{phaseDone}/{tasks.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((t) => {
                const on = done.has(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => setDetailId(t.id)} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "center", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "14px 16px", boxShadow: "var(--nm-elev)" }}>
                    <span
                      role="button" tabIndex={-1} aria-label={on ? "Mark not done" : "Mark done"}
                      onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                      style={{ width: 26, height: 26, flex: "none", borderRadius: 99, border: `1.5px solid ${on ? "var(--nm-mint)" : "var(--nm-line)"}`, background: on ? "var(--nm-mint)" : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      {on && <IconCheck size={14} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: on ? "var(--nm-muted)" : "var(--nm-text)", textDecoration: on ? "line-through" : "none" }}>{t.title}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.short}</span>
                    </span>
                    <span style={{ color: "var(--nm-muted)" }}><IconChevron /></span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RelocationTaskDetail({ task, done, onToggle, onBack }: { task: MoveTask; done: boolean; onToggle: () => void; onBack: () => void }) {
  const phaseLabel = PHASES.find((p) => p.id === task.phase)?.label ?? "";
  const searchUrl = task.search ? `https://www.google.com/search?q=${encodeURIComponent(task.search)}` : null;

  return (
    <div style={{ paddingBottom: 96, animation: "nmFade .3s ease-out" }}>
      <button type="button" onClick={onBack} aria-label="Back" className="nm-icon-btn nm-press" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>

      <span className="nm-pill">{phaseLabel}</span>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 23, fontWeight: 700, letterSpacing: "-.02em", marginTop: 12, lineHeight: 1.2 }}>{task.title}</div>
      <p style={{ marginTop: 12, fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6 }}>{task.about}</p>

      {/* Steps */}
      <div style={{ marginTop: 18 }}>
        <div className="nm-section-label" style={{ marginBottom: 10 }}>Checklist</div>
        <div className="nm-card nm-card-lg" style={{ padding: "6px 4px" }}>
          {task.steps.map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 14px", borderTop: i === 0 ? "none" : "1px solid var(--nm-line)" }}>
              <span style={{ width: 22, height: 22, flex: "none", borderRadius: 99, background: "var(--nm-soft)", color: "var(--nm-accent)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 11px var(--nm-font-text)" }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.45 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {task.tip && (
        <div className="nm-card" style={{ padding: "14px 16px", marginTop: 16, background: "var(--nm-soft)", boxShadow: "none", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ fontSize: 13, color: "var(--nm-accent)", lineHeight: 1.5 }}>{task.tip}</span>
        </div>
      )}

      {searchUrl && (
        <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="nm-press" style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none", color: "var(--nm-accent)", font: "600 13.5px var(--nm-font-text)" }}>Look up official info →</a>
      )}

      {/* Mark done */}
      <button
        type="button" onClick={onToggle} className="nm-press"
        style={{ all: "unset", cursor: "pointer", marginTop: 22, width: "100%", boxSizing: "border-box", height: 52, borderRadius: "var(--nm-r-md)", background: done ? "var(--nm-mint-soft)" : "var(--nm-accent)", color: done ? "#0b7a5a" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, font: "600 14.5px var(--nm-font-text)" }}
      >
        <IconCheck size={17} /> {done ? "Completed — tap to undo" : "Mark as done"}
      </button>
    </div>
  );
}
