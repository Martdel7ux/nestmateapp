import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { useDiscoverPreferences, useUpdateDiscoverPreferences } from "@/hooks/use-discover-preferences";
import { usePushSubscription } from "@/hooks/use-rent";
import { useDocuments, useExpiringDocuments } from "@/hooks/use-documents";
import { fetchPopularArticles, recordArticleView, createSupportMessage } from "@/features/help/api/help-api";
import { IconArrowLeft, IconShield, IconChevron } from "../icons";
import { stickyControl } from "../StickyBar";
import type { HelpArticle, SupportCategory } from "@/types/help";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};

function Shell({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 40px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13.5, color: "var(--nm-muted)", marginTop: 6 }}>{subtitle}</div>}
      <div style={{ marginTop: 22 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} style={{ all: "unset", cursor: disabled ? "default" : "pointer", flex: "none", opacity: disabled ? 0.5 : 1 }}>
      <span style={{ width: 46, height: 28, borderRadius: 99, background: on ? "var(--nm-accent)" : "var(--nm-surface2)", padding: 3, display: "flex", transition: "background .25s" }}>
        <span style={{ width: 22, height: 22, borderRadius: 99, background: "#fff", transition: "transform .25s", transform: `translateX(${on ? "18px" : "0"})` }} />
      </span>
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderTop: "1px solid var(--nm-line)" }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 14.5 }}>{label}</span>
        {desc && <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 3, lineHeight: 1.4 }}>{desc}</span>}
      </span>
      {children}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function NotificationsSettings({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { data: prefs } = useDiscoverPreferences();
  const update = useUpdateDiscoverPreferences();
  const push = usePushSubscription(user?.id);

  const notifyEmail = prefs?.notify_email ?? true;
  const notifyInApp = prefs?.notify_inapp ?? true;
  const freq = prefs?.notify_frequency ?? "instant";

  // Always send a complete row so the first upsert doesn't hit NOT NULL columns.
  const base = {
    interested_types: prefs?.interested_types ?? [],
    interested_tags: prefs?.interested_tags ?? [],
    location: prefs?.location ?? null,
    remote_ok: prefs?.remote_ok ?? false,
    notify_email: notifyEmail,
    notify_inapp: notifyInApp,
    notify_frequency: freq,
  };
  const save = (patch: Partial<typeof base>) => update.mutate({ ...base, ...patch });

  const pushOn = push.state === "granted";

  return (
    <Shell title="Notifications" subtitle="Choose how NestMate keeps you posted." onBack={onBack}>
      <div className="nm-card" style={{ overflow: "hidden" }}>
        <Row label="Push notifications" desc={
          push.state === "unsupported" ? "Not available on this device"
          : push.state === "denied" ? "Blocked — enable in your browser/OS settings"
          : "Rent reminders, new matches and messages"
        }>
          <Toggle
            on={pushOn}
            disabled={push.state === "unsupported" || push.state === "denied" || push.loading}
            onClick={() => (pushOn ? push.unsubscribe() : push.subscribe())}
          />
        </Row>
        <Row label="Email notifications" desc="Digests and important updates by email">
          <Toggle on={notifyEmail} onClick={() => save({ notify_email: !notifyEmail })} />
        </Row>
        <Row label="In-app notifications" desc="The bell on your home screen">
          <Toggle on={notifyInApp} onClick={() => save({ notify_inapp: !notifyInApp })} />
        </Row>
      </div>

      <div className="nm-section-label" style={{ margin: "22px 0 10px" }}>Frequency</div>
      <div className="nm-card" style={{ overflow: "hidden" }}>
        {(["instant", "daily", "weekly"] as const).map((f, i) => (
          <button key={f} type="button" onClick={() => save({ notify_frequency: f })} style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "center", gap: 12, padding: 16, borderTop: i === 0 ? "none" : "1px solid var(--nm-line)" }}>
            <span style={{ flex: 1, fontSize: 14.5, textTransform: "capitalize" }}>{f}</span>
            <span style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${freq === f ? "var(--nm-accent)" : "var(--nm-line)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {freq === f && <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--nm-accent)" }} />}
            </span>
          </button>
        ))}
      </div>
    </Shell>
  );
}

// ── Privacy & documents ───────────────────────────────────────────────────────
export function PrivacySettings({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { data: docs } = useDocuments(user?.id);
  const { data: expiring } = useExpiringDocuments(user?.id, 30);
  const docCount = docs?.length ?? 0;
  const expiringCount = expiring?.length ?? 0;

  return (
    <Shell title="Privacy & documents" subtitle="Your data, and how it's protected." onBack={onBack}>
      <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", gap: 13, alignItems: "flex-start" }}>
        <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: "var(--nm-mint-soft)", color: "#0b7a5a", display: "flex", alignItems: "center", justifyContent: "center" }}><IconShield size={20} /></span>
        <span>
          <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>Encrypted & private</span>
          <span style={{ display: "block", fontSize: 13, color: "var(--nm-muted)", marginTop: 4, lineHeight: 1.5 }}>Your documents are stored encrypted and only shared when you explicitly generate a share link. We never sell your data.</span>
        </span>
      </div>

      <div className="nm-section-label" style={{ margin: "22px 0 10px" }}>Your documents</div>
      <div className="nm-card" style={{ overflow: "hidden" }}>
        <Row label="Stored documents" desc="Passport, contracts, receipts and more">
          <span style={{ fontSize: 15, fontWeight: 600 }}>{docCount}</span>
        </Row>
        <Row label="Expiring soon" desc="Within the next 30 days">
          <span style={{ fontSize: 15, fontWeight: 600, color: expiringCount > 0 ? "var(--nm-coral)" : "var(--nm-muted)" }}>{expiringCount}</span>
        </Row>
      </div>

      <div className="nm-section-label" style={{ margin: "22px 0 10px" }}>Your data & rights</div>
      <div className="nm-card nm-card-lg" style={{ padding: 18 }}>
        {[
          "You can request a copy of your data any time via Help & support.",
          "Delete your account and all data permanently under Account.",
          "We only use your info to run NestMate — never for third-party ads.",
        ].map((t) => (
          <div key={t} style={{ display: "flex", gap: 10, padding: "8px 0", fontSize: 13, color: "var(--nm-text)", lineHeight: 1.5 }}>
            <span style={{ color: "var(--nm-accent)" }}>•</span><span>{t}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ── Help & support ────────────────────────────────────────────────────────────
const SUPPORT_CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: "bug", label: "Something's broken" },
  { value: "account", label: "Account help" },
  { value: "feature_request", label: "Feature idea" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Something else" },
];

export function HelpSettings({ onBack }: { onBack: () => void }) {
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const { data: articles } = useQuery({ queryKey: ["help-popular"], queryFn: () => fetchPopularArticles(5) });

  // Support form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportCategory>("bug");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const canSend = subject.trim().length > 2 && body.trim().length > 5 && status !== "sending";

  const send = async () => {
    if (!canSend) return;
    setStatus("sending");
    try {
      await createSupportMessage({ subject: subject.trim(), category, body: body.trim(), page_url: window.location.href });
      setStatus("sent");
      setSubject(""); setBody("");
    } catch {
      setStatus("error");
    }
  };

  if (article) {
    return (
      <Shell title={article.title} onBack={() => setArticle(null)}>
        {article.summary && <p style={{ fontSize: 14, color: "var(--nm-muted)", lineHeight: 1.6, marginTop: -8 }}>{article.summary}</p>}
        <div style={{ fontSize: 14, color: "var(--nm-text)", lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 14 }}>{article.content}</div>
      </Shell>
    );
  }

  return (
    <Shell title="Help & support" subtitle="Find an answer or reach the team." onBack={onBack}>
      {articles && articles.length > 0 && (
        <>
          <div className="nm-section-label" style={{ marginBottom: 10 }}>Popular articles</div>
          <div className="nm-card" style={{ overflow: "hidden", marginBottom: 22 }}>
            {articles.map((a, i) => (
              <button key={a.id} type="button" onClick={() => { setArticle(a); void recordArticleView(a.id); }} style={{ all: "unset", cursor: "pointer", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "center", gap: 12, padding: 16, borderTop: i === 0 ? "none" : "1px solid var(--nm-line)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 500 }}>{a.title}</span>
                  {a.summary && <span style={{ display: "block", fontSize: 12, color: "var(--nm-muted)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.summary}</span>}
                </span>
                <span style={{ color: "var(--nm-muted)" }}><IconChevron size={14} /></span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="nm-section-label" style={{ marginBottom: 10 }}>Contact us</div>
      {status === "sent" ? (
        <div className="nm-card nm-card-lg" style={{ padding: 22, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Message sent</div>
          <div style={{ fontSize: 13, color: "var(--nm-muted)", marginTop: 6, lineHeight: 1.5 }}>Thanks — we'll reply by email. You can send another any time.</div>
          <button type="button" onClick={() => setStatus("idle")} className="nm-press" style={{ all: "unset", cursor: "pointer", marginTop: 16, padding: "10px 20px", borderRadius: "var(--nm-r-md)", background: "var(--nm-surface2)", color: "var(--nm-text)", font: "600 13.5px Inter, sans-serif" }}>Send another</button>
        </div>
      ) : (
        <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="text" placeholder="Subject" value={subject} onChange={(e) => { setSubject(e.target.value); setStatus("idle"); }} style={inputStyle} />
          <select value={category} onChange={(e) => setCategory(e.target.value as SupportCategory)} style={inputStyle}>
            {SUPPORT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <textarea placeholder="How can we help?" value={body} onChange={(e) => { setBody(e.target.value); setStatus("idle"); }} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 110, font: "400 15px Inter, sans-serif" }} />
          {status === "error" && <div style={{ fontSize: 12.5, color: "var(--nm-coral)" }}>Couldn't send — please try again.</div>}
          <button type="button" onClick={send} disabled={!canSend} className="nm-press" style={{ all: "unset", cursor: canSend ? "pointer" : "not-allowed", textAlign: "center", padding: "13px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14.5px Inter, sans-serif", opacity: canSend ? 1 : 0.5 }}>
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </div>
      )}
    </Shell>
  );
}
