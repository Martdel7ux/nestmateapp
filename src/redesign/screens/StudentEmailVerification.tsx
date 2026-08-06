import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { IconArrowLeft, IconShield, IconCheck } from "../icons";
import { stickyControl } from "../StickyBar";
import { sendStudentEmailCode, verifyStudentEmailCode, fetchStudentStatus } from "@/lib/student-email-api";

/** Official Cyprus university email domains (mirrors the edge function). */
const UNIVERSITY_DOMAINS: { domain: string; name: string }[] = [
  { domain: "ucy.ac.cy", name: "University of Cyprus" },
  { domain: "cut.ac.cy", name: "Cyprus University of Technology" },
  { domain: "unic.ac.cy", name: "University of Nicosia" },
  { domain: "euc.ac.cy", name: "European University Cyprus" },
  { domain: "frederick.ac.cy", name: "Frederick University" },
  { domain: "uclancyprus.ac.cy", name: "UCLan Cyprus" },
  { domain: "nup.ac.cy", name: "Neapolis University Pafos" },
  { domain: "ouc.ac.cy", name: "Open University of Cyprus" },
];

function recognizeUniversity(email: string): { ok: boolean; name?: string } {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false };
  const domain = clean.split("@")[1] ?? "";
  const known = UNIVERSITY_DOMAINS.find((u) => domain === u.domain || domain.endsWith("." + u.domain));
  if (known) return { ok: true, name: known.name };
  if (/(^|\.)ac\.cy$/.test(domain) || /(^|\.)edu$/.test(domain) || /(^|\.)ac\.uk$/.test(domain) || /(^|\.)edu\.[a-z]{2,}$/.test(domain)) {
    return { ok: true };
  }
  return { ok: false };
}

interface StoredVerification { email: string; university?: string; verifiedAt: string; }

export function storageKeyFor(userId: string | undefined): string {
  return `nm-student-email-${userId ?? "guest"}`;
}
export function loadVerification(userId: string | undefined): StoredVerification | null {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    return raw ? (JSON.parse(raw) as StoredVerification) : null;
  } catch { return null; }
}
function saveVerification(userId: string | undefined, record: StoredVerification) {
  try { localStorage.setItem(storageKeyFor(userId), JSON.stringify(record)); } catch { /* ignore */ }
}

type Step = "email" | "code" | "done";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 16, color: "var(--nm-text)",
};

export function StudentEmailVerification({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const cached = loadVerification(user?.id);
  const [step, setStep] = useState<Step>(cached ? "done" : "email");
  const [record, setRecord] = useState<StoredVerification | null>(cached);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailedCode, setEmailedCode] = useState(false); // true when a real code was sent

  // Sync from the server (covers other devices / cleared cache).
  useEffect(() => {
    if (!user?.id) return;
    fetchStudentStatus(user.id).then((s) => {
      if (s.verifiedAt) {
        const rec = { email: s.email ?? "your university email", verifiedAt: s.verifiedAt };
        saveVerification(user.id, rec);
        setRecord(rec); setStep("done");
      }
    }).catch(() => { /* columns may not exist pre-migration */ });
  }, [user?.id]);

  const finish = (email: string, university?: string) => {
    const rec: StoredVerification = { email, university, verifiedAt: new Date().toISOString() };
    saveVerification(user?.id, rec);
    setRecord(rec); setStep("done"); setError(null);
  };

  const handleSend = async () => {
    setError(null);
    if (!email.trim()) return;
    setBusy(true);
    try {
      const res = await sendStudentEmailCode(email.trim());
      if (res.ok) { setEmailedCode(true); setStep("code"); }
      else if (res.reason === "invalid_domain") setError("That doesn't look like a university email. Use your official student address.");
      else if (res.reason === "rate_limited") setError(`Please wait ${res.retryIn ?? 30}s before requesting another code.`);
      else setError("Couldn't start verification. Please try again.");
    } catch {
      // Edge function unreachable (e.g. not deployed yet) → fall back to
      // recognising the university by its email domain.
      const rec = recognizeUniversity(email);
      if (rec.ok) finish(email.trim(), rec.name);
      else setError("That doesn't look like a university email. Use your official student address (e.g. name@ucy.ac.cy).");
    } finally { setBusy(false); }
  };

  const handleVerify = async () => {
    setError(null);
    if (code.trim().length < 6) { setError("Enter the 6-digit code from your email."); return; }
    setBusy(true);
    try {
      const res = await verifyStudentEmailCode(code.trim());
      if (res.ok) finish(email.trim(), res.university ?? undefined);
      else if (res.reason === "incorrect") setError(`Incorrect code${typeof res.remaining === "number" ? ` — ${res.remaining} attempts left` : ""}.`);
      else if (res.reason === "expired") setError("That code expired. Send a new one.");
      else if (res.reason === "too_many_attempts") setError("Too many attempts. Send a new code.");
      else setError("Couldn't verify that code.");
    } catch {
      setError("Verification is unavailable right now. Please try again later.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 40px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Student email</div>

      {/* ── Verified ─────────────────────────────────────────────────────── */}
      {step === "done" && record && (
        <div style={{ marginTop: 22 }}>
          <div className="nm-card nm-card-lg" style={{ padding: 22, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
            <span style={{ width: 60, height: 60, borderRadius: 99, background: "var(--nm-mint-soft)", color: "#0b7a5a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconShield size={28} />
            </span>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Student verified</div>
            <div style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5 }}>
              {record.university ? <>Recognized as a student at <b style={{ color: "var(--nm-text)" }}>{record.university}</b>.</> : "Your university email is verified."}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 99, background: "var(--nm-mint-soft)", color: "#0b7a5a", font: "600 12px var(--nm-font-text)" }}>
              <IconCheck size={13} /> {record.email}
            </span>
          </div>
          <button type="button" onClick={() => { setStep("email"); setEmail(""); setCode(""); setError(null); }} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", textAlign: "center", marginTop: 16, padding: 14, color: "var(--nm-muted)", font: "600 13.5px var(--nm-font-text)" }}>
            Use a different email
          </button>
        </div>
      )}

      {/* ── Enter email ──────────────────────────────────────────────────── */}
      {step === "email" && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6 }}>
            Verify your university email to earn the <b>verified student</b> badge and unlock student-only perks and discounts. We'll email you a 6-digit code.
          </p>
          <div className="nm-card nm-card-lg" style={{ padding: 18, marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="nm-section-label" style={{ fontSize: 11 }}>Your university email</div>
            <input type="email" inputMode="email" autoComplete="email" placeholder="name@ucy.ac.cy" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              style={{ ...inputStyle, borderColor: error ? "var(--nm-coral)" : "var(--nm-line)" }} />
            {error && <div style={{ fontSize: 12.5, color: "var(--nm-coral)", lineHeight: 1.4 }}>{error}</div>}
            <button type="button" onClick={handleSend} disabled={!email.trim() || busy} className="nm-press"
              style={{ all: "unset", cursor: email.trim() && !busy ? "pointer" : "not-allowed", textAlign: "center", padding: "13px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14.5px var(--nm-font-text)", opacity: email.trim() && !busy ? 1 : 0.5 }}>
              {busy ? "Sending…" : "Send code"}
            </button>
          </div>
          <div className="nm-card" style={{ padding: "14px 16px", marginTop: 16, background: "var(--nm-soft)", boxShadow: "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--nm-accent)", marginBottom: 6 }}>Recognized universities</div>
            <div style={{ fontSize: 12, color: "var(--nm-muted)", lineHeight: 1.6 }}>
              {UNIVERSITY_DOMAINS.map((u) => u.name).join(" · ")} — and any official <b>.ac.cy</b> or <b>.edu</b> address.
            </div>
          </div>
        </div>
      )}

      {/* ── Enter code ───────────────────────────────────────────────────── */}
      {step === "code" && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 14, color: "var(--nm-text)", lineHeight: 1.6 }}>
            {emailedCode ? <>We sent a 6-digit code to <b>{email}</b>. Enter it below to finish.</> : <>Enter the code we sent to <b>{email}</b>.</>}
          </p>
          <div className="nm-card nm-card-lg" style={{ padding: 18, marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "10px", fontSize: 24, fontWeight: 700, borderColor: error ? "var(--nm-coral)" : "var(--nm-line)" }} />
            {error && <div style={{ fontSize: 12.5, color: "var(--nm-coral)", lineHeight: 1.4 }}>{error}</div>}
            <button type="button" onClick={handleVerify} disabled={code.length < 6 || busy} className="nm-press"
              style={{ all: "unset", cursor: code.length >= 6 && !busy ? "pointer" : "not-allowed", textAlign: "center", padding: "13px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14.5px var(--nm-font-text)", opacity: code.length >= 6 && !busy ? 1 : 0.5 }}>
              {busy ? "Verifying…" : "Verify"}
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
            <button type="button" onClick={handleSend} disabled={busy} style={{ all: "unset", cursor: "pointer", color: "var(--nm-accent)", font: "600 13px var(--nm-font-text)" }}>Resend code</button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} style={{ all: "unset", cursor: "pointer", color: "var(--nm-muted)", font: "600 13px var(--nm-font-text)" }}>Change email</button>
          </div>
        </div>
      )}
    </div>
  );
}
