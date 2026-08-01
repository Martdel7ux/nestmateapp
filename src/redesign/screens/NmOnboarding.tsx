import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useOnboarding } from "@/features/onboarding/hooks/useOnboarding";
import { cities } from "@/lib/constants";
import type { OnboardingUserType } from "@/types/onboarding";
import { ModuleIcon, IconArrowLeft, type ModuleIconName } from "../icons";
import "../nm-theme.css";

const GOALS: { id: OnboardingUserType; icon: ModuleIconName; label: string; note: string }[] = [
  { id: "student_housing", icon: "discover", label: "Find a home", note: "Verified student accommodation" },
  { id: "student_flatmates", icon: "matches", label: "Find flatmates", note: "Matched on how you live" },
  { id: "student_tools", icon: "campus", label: "Student life & tools", note: "Bills, events, campus, jobs" },
  { id: "landlord", icon: "bills", label: "I'm a landlord", note: "List and manage properties" },
];

const INTERESTS: { id: string; icon: ModuleIconName; label: string }[] = [
  { id: "housing", icon: "discover", label: "Housing" },
  { id: "roommates", icon: "matches", label: "Roommates" },
  { id: "societies", icon: "community", label: "Societies" },
  { id: "jobs", icon: "jobs", label: "Jobs" },
  { id: "events", icon: "events", label: "Events" },
  { id: "deals", icon: "deals", label: "Discounts" },
];

const btn: React.CSSProperties = {
  all: "unset", cursor: "pointer", textAlign: "center", padding: 17, borderRadius: "var(--nm-r-md)",
  background: "var(--nm-accent)", color: "#fff", font: "600 16px Inter, sans-serif",
};
const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: "var(--nm-r-md)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", boxShadow: "var(--nm-elev)",
  fontSize: 16, color: "var(--nm-text)",
};

export function NmOnboarding() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const { setUserType, patchStudentPrefs, patchLandlordPrefs, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 intro, 1 goal, 2 details, 3 interests
  const [goal, setGoal] = useState<OnboardingUserType | null>(null);
  const [university, setUniversity] = useState("");
  const [city, setCity] = useState("Nicosia");
  const [budget, setBudget] = useState("");
  const [propertyCount, setPropertyCount] = useState("");
  const [picked, setPicked] = useState<string[]>(["housing", "roommates"]);
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/welcome" replace />;

  const isLandlord = goal === "landlord";
  const totalBars = 3; // goal, details, interests

  const saveDetails = () => {
    if (isLandlord) patchLandlordPrefs({ location: city, propertyCount });
    else patchStudentPrefs({ university, city, budget });
  };

  const finish = async () => {
    setBusy(true);
    try {
      await completeOnboarding();
      navigate("/", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div data-nm={resolvedTheme === "dark" ? "dark" : "light"} style={{ minHeight: "100dvh", background: "var(--nm-bg)", display: "flex", flexDirection: "column", padding: "calc(50px + env(safe-area-inset-top)) 26px calc(30px + env(safe-area-inset-bottom))" }}>
      {/* Progress bars (steps 1-3) */}
      {step > 0 && (
        <div style={{ display: "flex", gap: 5, marginBottom: 34 }}>
          {Array.from({ length: totalBars }).map((_, i) => (
            <span key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i < step ? "var(--nm-accent)" : "var(--nm-surface2)", transition: "background .4s" }} />
          ))}
        </div>
      )}

      {step > 0 && (
        <button type="button" onClick={back} aria-label="Back" style={{ ...btn, background: "var(--nm-surface)", color: "var(--nm-text)", width: 38, height: 38, padding: 0, borderRadius: 99, boxShadow: "var(--nm-elev)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
          <IconArrowLeft size={17} />
        </button>
      )}

      {/* Step 0 — intro */}
      {step === 0 && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, animation: "nmFade .3s ease-out" }}>
          <div style={{ width: 74, height: 74, borderRadius: 26, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
            <ModuleIcon name="community" size={34} />
          </div>
          <div>
            <div style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-.03em" }}>Welcome to NestMate</div>
            <div style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--nm-muted)", marginTop: 14 }}>
              Homes, roommates, bills, societies and student life — set up in under a minute.
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — goal */}
      {step === 1 && (
        <div style={{ flex: 1, animation: "nmFade .3s ease-out" }}>
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.18 }}>What brings you to NestMate?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {GOALS.map((g) => {
              const on = goal === g.id;
              return (
                <button key={g.id} type="button" onClick={() => setGoal(g.id)} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: on ? "var(--nm-soft)" : "var(--nm-surface)", border: `1px solid ${on ? "var(--nm-accent)" : "var(--nm-line)"}`, borderRadius: "var(--nm-r-md)", padding: "15px 16px", boxShadow: "var(--nm-elev)" }}>
                  <span style={{ width: 38, height: 38, flex: "none", borderRadius: 13, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
                    <ModuleIcon name={g.icon} size={19} />
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{g.label}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 2 }}>{g.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2 — details */}
      {step === 2 && (
        <div style={{ flex: 1, animation: "nmFade .3s ease-out" }}>
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em" }}>{isLandlord ? "Your properties" : "A few details"}</div>
          <div style={{ fontSize: 14.5, color: "var(--nm-muted)", marginTop: 10 }}>You can change these any time.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {!isLandlord && (
              <input style={input} placeholder="University" value={university} onChange={(e) => setUniversity(e.target.value)} />
            )}
            <select style={input} value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {isLandlord ? (
              <input style={input} type="number" placeholder="Number of properties" value={propertyCount} onChange={(e) => setPropertyCount(e.target.value)} />
            ) : (
              <input style={input} type="number" placeholder="Monthly budget (€)" value={budget} onChange={(e) => setBudget(e.target.value)} />
            )}
          </div>
        </div>
      )}

      {/* Step 3 — interests */}
      {step === 3 && (
        <div style={{ flex: 1, animation: "nmFade .3s ease-out" }}>
          <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em" }}>What matters most?</div>
          <div style={{ fontSize: 14.5, color: "var(--nm-muted)", marginTop: 10 }}>Pick a few. We'll tailor your home screen.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {INTERESTS.map((p) => {
              const on = picked.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setPicked((cur) => on ? cur.filter((x) => x !== p.id) : [...cur, p.id])} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: on ? "var(--nm-soft)" : "var(--nm-surface)", border: `1px solid ${on ? "var(--nm-accent)" : "var(--nm-line)"}`, borderRadius: "var(--nm-r-md)", padding: "14px 16px" }}>
                  <span style={{ width: 32, height: 32, flex: "none", borderRadius: 11, background: "var(--nm-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--nm-accent)" }}>
                    <ModuleIcon name={p.icon} size={17} />
                  </span>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>{p.label}</span>
                  <span style={{ width: 20, height: 20, borderRadius: 99, border: `1.5px solid ${on ? "var(--nm-accent)" : "var(--nm-line)"}`, background: on ? "var(--nm-accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                    {on ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 22 }}>
        {step === 0 && (
          <button type="button" style={btn} onClick={() => setStep(1)}>Get started</button>
        )}
        {step === 1 && (
          <button type="button" style={{ ...btn, opacity: goal ? 1 : 0.5 }} disabled={!goal} onClick={() => { if (goal) { setUserType(goal); setStep(2); } }}>Continue</button>
        )}
        {step === 2 && (
          <button type="button" style={btn} onClick={() => { saveDetails(); setStep(3); }}>Continue</button>
        )}
        {step === 3 && (
          <button type="button" style={{ ...btn, opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={() => void finish()}>{busy ? "Setting up…" : "Enter NestMate"}</button>
        )}
      </div>
    </div>
  );
}
