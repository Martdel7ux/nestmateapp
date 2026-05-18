import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail, MessageCircle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { createSupportMessage } from "@/features/help/api/help-api";

const SUPPORT_EMAIL    = "support@nestmate.app";
const SUPPORT_WHATSAPP = "+35799000000";

const CATEGORIES = [
  { id: "bug",             label: "Bug or something broken" },
  { id: "feature_request", label: "Feature request" },
  { id: "account",        label: "Account issue" },
  { id: "billing",        label: "Billing / payment" },
  { id: "other",          label: "Other" },
];

export function ContactFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [subject,  setSubject]  = useState(params.get("subject") ?? "");
  const [category, setCategory] = useState("other");
  const [body,     setBody]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const waText = encodeURIComponent("Hi, I need help with Nestmate.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 20) { setError("Please write at least 20 characters."); return; }
    setSaving(true); setError("");
    try {
      await createSupportMessage({
        subject,
        category,
        body: body.trim(),
        page_url: window.location.href,
      });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title="Contact Support" universalSearch={false} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 pb-32 space-y-5">

          {done ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 size={30} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Message sent!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll respond within 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/profile/help/my-tickets")}
                className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                View my tickets
              </button>
            </div>
          ) : (
            <>
              {/* Quick channels */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, "")}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 transition hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <MessageCircle size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">WhatsApp us</p>
                    <p className="text-[10px] text-muted-foreground">Usually fast</p>
                  </div>
                </a>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3 transition hover:bg-muted/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Mail size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Email us</p>
                    <p className="text-[10px] text-muted-foreground">{SUPPORT_EMAIL}</p>
                  </div>
                </a>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-[11px] text-muted-foreground">or send a message</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Message</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe your issue in detail…"
                    rows={5}
                    maxLength={5000}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground text-right">
                    {body.length}/5000
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Sending…" : "Send message"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
