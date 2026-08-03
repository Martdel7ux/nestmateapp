import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  useRentAgreements, useRentPayments, useUpcomingRentPayment,
  useCreateRentAgreement, useMarkRentPaid,
} from "@/hooks/use-rent";
import { formatCurrency } from "@/lib/household-utils";
import { rentDueLabel } from "../util";
import { IconCheck } from "../icons";
import type { RentPayment, RentPaymentStatus, RentAgreementFormData } from "@/types/rent";

const STATUS_STYLE: Record<RentPaymentStatus, { bg: string; fg: string; label: string }> = {
  paid:      { bg: "var(--nm-mint-soft)", fg: "#0b7a5a", label: "Paid" },
  upcoming:  { bg: "var(--nm-surface2)",  fg: "var(--nm-muted)", label: "Upcoming" },
  reminded:  { bg: "var(--nm-soft)",      fg: "var(--nm-accent)", label: "Reminded" },
  due_today: { bg: "var(--nm-soft)",      fg: "var(--nm-accent)", label: "Due today" },
  late:      { bg: "var(--nm-coral-soft)", fg: "#b23b32", label: "Late" },
  skipped:   { bg: "var(--nm-surface2)",  fg: "var(--nm-muted)", label: "Skipped" },
};

function StatusPill({ status }: { status: RentPaymentStatus }) {
  const s = STATUS_STYLE[status];
  return <span style={{ padding: "4px 10px", borderRadius: 99, background: s.bg, color: s.fg, font: "600 11px Inter, sans-serif" }}>{s.label}</span>;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Rent & bills — real rent agreement, payments, mark-paid, landlord contact + bill splitter. */
export function BillsBody() {
  const { user } = useAuth();
  const { data: agreements, isLoading } = useRentAgreements(user?.id);
  const active = agreements?.find((a) => a.is_active) ?? agreements?.[0];
  const { data: payments } = useRentPayments(active?.id);
  const { data: upcoming } = useUpcomingRentPayment(user?.id);

  if (isLoading) return null;
  if (!active) return <RentSetup />;

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 18 }}>
      {upcoming
        ? <NextPaymentCard payment={upcoming} userId={user!.id} />
        : (
          <div className="nm-card nm-card-lg" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up 🎉</div>
            <div style={{ fontSize: 12.5, color: "var(--nm-muted)", marginTop: 4 }}>No rent due right now.</div>
          </div>
        )}

      <LandlordCard
        name={active.landlord_name}
        phone={active.landlord_phone}
        email={active.landlord_email}
        whatsapp={active.landlord_whatsapp}
      />

      {payments && payments.length > 0 && (
        <div>
          <div className="nm-section-label" style={{ marginBottom: 10 }}>Payment history</div>
          <div className="nm-card nm-card-lg" style={{ padding: 6 }}>
            {payments.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: i === 0 ? "none" : "1px solid var(--nm-line)" }}>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{formatCurrency(Number(p.amount), p.currency)}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--nm-muted)", marginTop: 2 }}>{monthLabel(p.due_date)}</span>
                </span>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <BillSplitter />
    </div>
  );
}

function NextPaymentCard({ payment, userId }: { payment: RentPayment; userId: string }) {
  const markPaid = useMarkRentPaid(payment.id, userId);
  const overdue = payment.status === "late" || rentDueLabel(payment.due_date) === "overdue";

  return (
    <div className="nm-card nm-card-lg" style={{ padding: 20, background: overdue ? "var(--nm-coral-soft)" : "var(--nm-surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Next rent</span>
        <StatusPill status={payment.status} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-.03em" }}>{formatCurrency(Number(payment.amount), payment.currency)}</span>
        <span style={{ fontSize: 13, color: overdue ? "#b23b32" : "var(--nm-muted)" }}>{rentDueLabel(payment.due_date)} · {monthLabel(payment.due_date)}</span>
      </div>
      <button
        type="button"
        onClick={() => markPaid.mutate({ payment, form: { paid_at: new Date().toISOString().slice(0, 10) } })}
        disabled={markPaid.isPending}
        className="nm-press"
        style={{ all: "unset", cursor: "pointer", marginTop: 16, width: "100%", boxSizing: "border-box", height: 48, borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, font: "600 14.5px Inter, sans-serif", opacity: markPaid.isPending ? 0.6 : 1 }}
      >
        <IconCheck size={17} /> {markPaid.isPending ? "Saving…" : "Mark as paid"}
      </button>
    </div>
  );
}

function LandlordCard({ name, phone, email, whatsapp }: { name?: string | null; phone?: string | null; email?: string | null; whatsapp?: string | null }) {
  if (!name && !phone && !email && !whatsapp) return null;
  const actions: { label: string; href: string }[] = [];
  if (whatsapp) actions.push({ label: "WhatsApp", href: `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` });
  if (phone) actions.push({ label: "Call", href: `tel:${phone}` });
  if (email) actions.push({ label: "Email", href: `mailto:${email}` });

  return (
    <div className="nm-card nm-card-lg" style={{ padding: 18 }}>
      <div className="nm-section-label" style={{ marginBottom: 8 }}>Landlord</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{name ?? "Your landlord"}</div>
      {actions.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {actions.map((a) => (
            <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className="nm-press" style={{ flex: 1, textAlign: "center", textDecoration: "none", padding: "10px 0", borderRadius: "var(--nm-r-sm)", background: "var(--nm-surface2)", color: "var(--nm-text)", font: "600 12.5px Inter, sans-serif" }}>{a.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Standalone utility — split a shared bill between flatmates. */
function BillSplitter() {
  const [total, setTotal] = useState("");
  const [people, setPeople] = useState(2);
  const amount = parseFloat(total);
  const per = Number.isFinite(amount) && amount > 0 ? amount / people : 0;

  return (
    <div>
      <div className="nm-section-label" style={{ marginBottom: 10 }}>Split a bill</div>
      <div className="nm-card nm-card-lg" style={{ padding: 18 }}>
        <input
          type="number" inputMode="decimal" placeholder="Total amount (€)" value={total}
          onChange={(e) => setTotal(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: "var(--nm-r-sm)", border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>Split between</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={() => setPeople((n) => Math.max(1, n - 1))} className="nm-press" style={stepperBtn}>−</button>
            <span style={{ minWidth: 20, textAlign: "center", fontSize: 16, fontWeight: 600 }}>{people}</span>
            <button type="button" onClick={() => setPeople((n) => Math.min(20, n + 1))} className="nm-press" style={stepperBtn}>+</button>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--nm-line)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13.5, color: "var(--nm-muted)" }}>Each person pays</span>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", color: "var(--nm-accent)" }}>{formatCurrency(per, "EUR")}</span>
        </div>
      </div>
    </div>
  );
}

const stepperBtn: React.CSSProperties = {
  all: "unset", cursor: "pointer", width: 34, height: 34, borderRadius: 99,
  background: "var(--nm-surface2)", color: "var(--nm-text)", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600,
};

/** Compact set-up form shown when the student has no rent agreement yet. */
function RentSetup() {
  const { user } = useAuth();
  const create = useCreateRentAgreement(user?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [firstDate, setFirstDate] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canSubmit = parseFloat(amount) > 0 && !!firstDate && !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    const form: RentAgreementFormData = {
      amount, currency: "EUR", due_day: dueDay, first_payment_date: firstDate,
      open_ended: true, scope: "personal",
      landlord_name: landlordName || undefined,
      landlord_phone: landlordPhone || undefined,
      reminder_days_before: 3,
      reminder_followup_on_due_day: true,
      reminder_channels: ["in_app"],
    };
    create.mutate(form);
  };

  if (!showForm) {
    return (
      <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
        <span className="nm-pill">Track your rent</span>
        <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 280 }}>
          Add your rent agreement to see when payments are due, mark them paid, and keep your landlord's details handy.
        </p>
        <button type="button" onClick={() => setShowForm(true)} className="nm-press" style={{ all: "unset", cursor: "pointer", marginTop: 4, padding: "12px 22px", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px Inter, sans-serif" }}>Set up rent</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="nm-card nm-card-lg" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Rent agreement</div>

        <Field label="Monthly rent (€)">
          <input type="number" inputMode="decimal" placeholder="e.g. 450" value={amount} onChange={(e) => setAmount(e.target.value)} style={fieldInput} />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Due day of month">
            <select value={dueDay} onChange={(e) => setDueDay(e.target.value)} style={fieldInput}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="First payment">
            <input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} style={fieldInput} />
          </Field>
        </div>

        <Field label="Landlord name (optional)">
          <input type="text" placeholder="Full name" value={landlordName} onChange={(e) => setLandlordName(e.target.value)} style={fieldInput} />
        </Field>
        <Field label="Landlord phone (optional)">
          <input type="tel" placeholder="+357…" value={landlordPhone} onChange={(e) => setLandlordPhone(e.target.value)} style={fieldInput} />
        </Field>

        {create.isError && <div style={{ fontSize: 12.5, color: "var(--nm-coral)" }}>Couldn't save — please try again.</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" onClick={() => setShowForm(false)} style={{ all: "unset", cursor: "pointer", padding: "12px 18px", borderRadius: "var(--nm-r-md)", color: "var(--nm-muted)", font: "600 14px Inter, sans-serif" }}>Cancel</button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="nm-press" style={{ all: "unset", cursor: canSubmit ? "pointer" : "not-allowed", flex: 1, textAlign: "center", padding: "12px 0", borderRadius: "var(--nm-r-md)", background: "var(--nm-accent)", color: "#fff", font: "600 14px Inter, sans-serif", opacity: canSubmit ? 1 : 0.5 }}>{create.isPending ? "Saving…" : "Save agreement"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ flex: 1, display: "block" }}>
      <span className="nm-section-label" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

const fieldInput: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: "var(--nm-r-sm)",
  border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 15, color: "var(--nm-text)",
};
