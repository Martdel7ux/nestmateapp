import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { IconArrowLeft } from "../icons";
import { stickyControl } from "../StickyBar";

type Status = { kind: "idle" | "saving" | "ok" | "error"; msg?: string };

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};

function Note({ status }: { status: Status }) {
  if (status.kind === "ok") return <div style={{ fontSize: 12.5, color: "#0b7a5a", marginTop: 2 }}>{status.msg}</div>;
  if (status.kind === "error") return <div style={{ fontSize: 12.5, color: "var(--nm-coral)", marginTop: 2 }}>{status.msg}</div>;
  return null;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 15.5, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

export function AccountSettings({ onBack }: { onBack: () => void }) {
  const { user, updateEmail, updatePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // ── Change email ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<Status>({ kind: "idle" });
  const emailValid = /.+@.+\..+/.test(email) && email.trim().toLowerCase() !== (user?.email ?? "").toLowerCase();

  const submitEmail = async () => {
    if (!emailValid || emailStatus.kind === "saving") return;
    setEmailStatus({ kind: "saving" });
    try {
      await updateEmail(email.trim());
      setEmailStatus({ kind: "ok", msg: "Confirmation sent — check your new inbox to finish the change." });
      setEmail("");
    } catch (e) {
      setEmailStatus({ kind: "error", msg: e instanceof Error ? e.message : "Couldn't update email." });
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>({ kind: "idle" });
  const pwValid = pw.length >= 8 && pw === pw2;

  const submitPassword = async () => {
    if (pwStatus.kind === "saving") return;
    if (pw.length < 8) { setPwStatus({ kind: "error", msg: "Password must be at least 8 characters." }); return; }
    if (pw !== pw2) { setPwStatus({ kind: "error", msg: "Passwords don't match." }); return; }
    setPwStatus({ kind: "saving" });
    try {
      await updatePassword(pw);
      setPwStatus({ kind: "ok", msg: "Password updated." });
      setPw(""); setPw2("");
    } catch (e) {
      setPwStatus({ kind: "error", msg: e instanceof Error ? e.message : "Couldn't update password." });
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [delStatus, setDelStatus] = useState<Status>({ kind: "idle" });
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const submitDelete = async () => {
    if (!canDelete || delStatus.kind === "saving") return;
    setDelStatus({ kind: "saving" });
    try {
      await deleteAccount();
      navigate("/welcome", { replace: true });
    } catch (e) {
      setDelStatus({ kind: "error", msg: e instanceof Error ? e.message : "Couldn't delete account. Please try again." });
    }
  };

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 40px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Account</div>
      <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 6 }}>Signed in as {user?.email ?? "—"}</div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Change email */}
        <SectionCard title="Change email">
          <input type="email" inputMode="email" autoComplete="email" placeholder="New email address" value={email} onChange={(e) => { setEmail(e.target.value); setEmailStatus({ kind: "idle" }); }} style={inputStyle} />
          <Note status={emailStatus} />
          <button type="button" onClick={submitEmail} disabled={!emailValid || emailStatus.kind === "saving"} className="nm-press" style={{ all: "unset", cursor: emailValid ? "pointer" : "not-allowed", textAlign: "center", padding: "12px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px var(--nm-font-text)", opacity: emailValid && emailStatus.kind !== "saving" ? 1 : 0.5 }}>
            {emailStatus.kind === "saving" ? "Sending…" : "Update email"}
          </button>
        </SectionCard>

        {/* Change password */}
        <SectionCard title="Change password">
          <input type="password" autoComplete="new-password" placeholder="New password (min 8 characters)" value={pw} onChange={(e) => { setPw(e.target.value); setPwStatus({ kind: "idle" }); }} style={inputStyle} />
          <input type="password" autoComplete="new-password" placeholder="Confirm new password" value={pw2} onChange={(e) => { setPw2(e.target.value); setPwStatus({ kind: "idle" }); }} style={inputStyle} />
          <Note status={pwStatus} />
          <button type="button" onClick={submitPassword} disabled={!pwValid || pwStatus.kind === "saving"} className="nm-press" style={{ all: "unset", cursor: pwValid ? "pointer" : "not-allowed", textAlign: "center", padding: "12px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px var(--nm-font-text)", opacity: pwValid && pwStatus.kind !== "saving" ? 1 : 0.5 }}>
            {pwStatus.kind === "saving" ? "Saving…" : "Update password"}
          </button>
        </SectionCard>

        {/* Delete account */}
        <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, border: "1px solid var(--nm-coral-soft)" }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--nm-coral)" }}>Delete account</div>
          <p style={{ fontSize: 13, color: "var(--nm-muted)", lineHeight: 1.5, margin: 0 }}>
            This permanently erases your profile, listings, matches, messages and documents. This cannot be undone.
          </p>

          {!confirming ? (
            <button type="button" onClick={() => setConfirming(true)} className="nm-press" style={{ all: "unset", cursor: "pointer", textAlign: "center", padding: "12px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-coral-soft)", color: "var(--nm-coral)", font: "600 14px var(--nm-font-text)" }}>
              Delete my account
            </button>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: "var(--nm-text)" }}>Type <b>DELETE</b> to confirm.</div>
              <input type="text" placeholder="DELETE" value={confirmText} onChange={(e) => { setConfirmText(e.target.value); setDelStatus({ kind: "idle" }); }} style={inputStyle} />
              <Note status={delStatus} />
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => { setConfirming(false); setConfirmText(""); setDelStatus({ kind: "idle" }); }} style={{ all: "unset", cursor: "pointer", padding: "12px 18px", borderRadius: "var(--nm-r-md)", color: "var(--nm-muted)", font: "600 14px var(--nm-font-text)" }}>Cancel</button>
                <button type="button" onClick={submitDelete} disabled={!canDelete || delStatus.kind === "saving"} className="nm-press" style={{ all: "unset", cursor: canDelete ? "pointer" : "not-allowed", flex: 1, textAlign: "center", padding: "12px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-coral)", color: "#fff", font: "600 14px var(--nm-font-text)", opacity: canDelete && delStatus.kind !== "saving" ? 1 : 0.5 }}>
                  {delStatus.kind === "saving" ? "Deleting…" : "Permanently delete"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
