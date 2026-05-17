import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RentAgreementFormData, RentPaymentMethod, RentReminderChannel } from "@/types/rent";
import type { Household } from "@/types/household";
import { usePushSubscription } from "@/hooks/use-rent";

const STEPS = ["Amount", "Schedule", "Landlord", "Payment", "Reminders", "Review"] as const;

const EMPTY: RentAgreementFormData = {
  amount: "",
  currency: "EUR",
  due_day: "1",
  first_payment_date: new Date().toISOString().slice(0, 10),
  open_ended: true,
  end_date: "",
  scope: "personal",
  household_id: "",
  landlord_name: "",
  landlord_phone: "",
  landlord_email: "",
  landlord_whatsapp: "",
  payment_method: undefined,
  payment_details: "",
  reminder_days_before: 3,
  reminder_followup_on_due_day: true,
  reminder_channels: ["in_app"],
};

interface Props {
  initial?: Partial<RentAgreementFormData>;
  households?: Household[];
  userId: string;
  onSubmit: (form: RentAgreementFormData) => Promise<void>;
  isPending: boolean;
  footer?: React.ReactNode;
}

export function RentAgreementForm({ initial, households = [], userId, onSubmit, isPending, footer }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RentAgreementFormData>({ ...EMPTY, ...initial });
  const push = usePushSubscription(userId);

  function set<K extends keyof RentAgreementFormData>(key: K, value: RentAgreementFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleChannel(ch: RentReminderChannel) {
    const channels = form.reminder_channels.includes(ch)
      ? form.reminder_channels.filter((c) => c !== ch)
      : [...form.reminder_channels, ch];
    // Always keep in_app
    set("reminder_channels", channels.includes("in_app") ? channels : ["in_app", ...channels]);
  }

  async function handleSubmit() {
    await onSubmit(form);
  }

  const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide";

  const steps = [
    // Step 0: Amount
    <div key="amount" className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Monthly rent amount</h2>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
        <input
          type="number" min="1" step="0.01" required
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          placeholder="0.00"
          className={cn(inputCls, "pl-8")}
        />
      </div>
      {households.length > 0 && (
        <div className="space-y-2">
          <label className={labelCls}>Scope</label>
          <div className="flex gap-2">
            {(["personal", "household"] as const).map((s) => (
              <button key={s} type="button"
                onClick={() => set("scope", s)}
                className={cn("flex-1 rounded-2xl py-2.5 text-sm font-semibold border transition-all",
                  form.scope === s ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"
                )}>
                {s === "personal" ? "Personal" : "Household"}
              </button>
            ))}
          </div>
          {form.scope === "household" && households.length > 0 && (
            <select value={form.household_id} onChange={(e) => set("household_id", e.target.value)}
              className={inputCls}>
              <option value="">— Select household —</option>
              {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
        </div>
      )}
    </div>,

    // Step 1: Schedule
    <div key="schedule" className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Payment schedule</h2>
      <div>
        <label className={labelCls}>Due day of the month</label>
        <input type="number" min="1" max="31" value={form.due_day}
          onChange={(e) => set("due_day", e.target.value)} className={inputCls} />
        <p className="text-xs text-muted-foreground mt-1">e.g. 1 = first of every month</p>
      </div>
      <div>
        <label className={labelCls}>First payment date</label>
        <input type="date" value={form.first_payment_date}
          onChange={(e) => set("first_payment_date", e.target.value)} className={inputCls} />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set("open_ended", !form.open_ended)}
          className={cn("h-6 w-11 rounded-full transition-colors shrink-0",
            form.open_ended ? "bg-primary" : "bg-muted"
          )}>
          <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5",
            form.open_ended ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
        <span className="text-sm text-foreground">Open-ended lease (no end date)</span>
      </div>
      {!form.open_ended && (
        <div>
          <label className={labelCls}>End date</label>
          <input type="date" value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)} className={inputCls} />
        </div>
      )}
    </div>,

    // Step 2: Landlord
    <div key="landlord" className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Landlord details</h2>
      <p className="text-sm text-muted-foreground">Optional — used for one-tap contact from reminders.</p>
      {[
        { key: "landlord_name",      label: "Name",      placeholder: "Maria Georgiou",     type: "text" },
        { key: "landlord_phone",     label: "Phone",     placeholder: "+357 99 000000",      type: "tel" },
        { key: "landlord_whatsapp",  label: "WhatsApp",  placeholder: "+357 99 000000",      type: "tel" },
        { key: "landlord_email",     label: "Email",     placeholder: "landlord@email.com",  type: "email" },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label className={labelCls}>{label}</label>
          <input type={type} value={(form as unknown as Record<string, string>)[key] ?? ""}
            onChange={(e) => set(key as keyof RentAgreementFormData, e.target.value as never)}
            placeholder={placeholder} className={inputCls} />
        </div>
      ))}
    </div>,

    // Step 3: Payment method
    <div key="payment" className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">How do you pay?</h2>
      <div className="grid grid-cols-2 gap-2">
        {(["bank_transfer","revolut","cash","cheque","other"] as RentPaymentMethod[]).map((m) => (
          <button key={m} type="button" onClick={() => set("payment_method", m)}
            className={cn("rounded-2xl py-3 text-sm font-semibold border capitalize transition-all",
              form.payment_method === m ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground"
            )}>
            {m.replace("_", " ")}
          </button>
        ))}
      </div>
      {form.payment_method && form.payment_method !== "cash" && (
        <div>
          <label className={labelCls}>
            {form.payment_method === "bank_transfer" ? "IBAN / Account details" :
             form.payment_method === "revolut"       ? "Revolut tag or link" : "Details"}
          </label>
          <input type="text" value={form.payment_details ?? ""}
            onChange={(e) => set("payment_details", e.target.value)}
            placeholder={form.payment_method === "revolut" ? "@username or link" : "IE29 AIBK 9311 5212 3456 78"}
            className={inputCls} />
        </div>
      )}
    </div>,

    // Step 4: Reminders
    <div key="reminders" className="space-y-5">
      <h2 className="text-lg font-bold text-foreground">Reminder settings</h2>
      <div>
        <label className={labelCls}>Days before due date: <span className="text-primary">{form.reminder_days_before}</span></label>
        <input type="range" min="0" max="14" value={form.reminder_days_before}
          onChange={(e) => set("reminder_days_before", parseInt(e.target.value))}
          className="w-full accent-primary" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Same day</span><span>7 days</span><span>14 days</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => set("reminder_followup_on_due_day", !form.reminder_followup_on_due_day)}
          className={cn("h-6 w-11 rounded-full transition-colors shrink-0",
            form.reminder_followup_on_due_day ? "bg-primary" : "bg-muted"
          )}>
          <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5",
            form.reminder_followup_on_due_day ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
        <span className="text-sm text-foreground">Follow-up reminder on due day</span>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Reminder channels</label>
        {[
          { ch: "in_app" as RentReminderChannel, label: "In-app",      note: "Always on",   locked: true },
          { ch: "push"   as RentReminderChannel, label: "Push",         note: push.state === "denied" ? "Blocked in browser settings" : push.state === "unsupported" ? "Not supported" : "" },
          { ch: "email"  as RentReminderChannel, label: "Email",        note: "" },
        ].map(({ ch, label, note, locked }) => (
          <div key={ch} className="flex items-center gap-3">
            <button type="button"
              disabled={locked || push.state === "unsupported" && ch === "push"}
              onClick={async () => {
                if (ch === "push" && !form.reminder_channels.includes("push") && push.state !== "granted") {
                  await push.subscribe();
                }
                toggleChannel(ch);
              }}
              className={cn("h-6 w-11 rounded-full transition-colors shrink-0",
                form.reminder_channels.includes(ch) ? "bg-primary" : "bg-muted",
                locked && "opacity-70 cursor-not-allowed"
              )}>
              <span className={cn("block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5",
                form.reminder_channels.includes(ch) ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
            <div>
              <span className="text-sm text-foreground">{label}</span>
              {note && <p className="text-xs text-muted-foreground">{note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Step 5: Review
    <div key="review" className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Review</h2>
      <div className="rounded-2xl bg-primary/5 p-4 space-y-2">
        {[
          ["Amount",       `€${form.amount} / month`],
          ["Due day",      `${form.due_day}${["st","nd","rd"][parseInt(form.due_day)-1]||"th"} of the month`],
          ["First payment", form.first_payment_date],
          ["End date",     form.open_ended ? "Open-ended" : (form.end_date || "—")],
          ["Scope",        form.scope],
          ["Landlord",     form.landlord_name || "—"],
          ["Payment",      form.payment_method?.replace("_"," ") || "—"],
          ["Reminders",    `${form.reminder_days_before} days before`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-semibold text-foreground capitalize">{v}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Step indicators */}
      <div className="flex gap-1 px-5 pt-3 pb-4">
        {STEPS.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
            i <= step ? "bg-primary" : "bg-muted"
          )} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {steps[step]}

        {/* Navigation — inside scroll so it's always reachable above nav bar */}
        <div className="flex gap-3 pt-6 pb-28">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border border-border py-3.5 text-sm font-semibold text-foreground">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button"
            disabled={step === 0 && !form.amount}
            onClick={() => setStep((s) => s + 1)}
            className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            Next
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isPending}
            className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {isPending ? "Saving…" : "Save Rent Agreement"}
          </button>
        )}
        </div>
        {footer && <div className="pt-3">{footer}</div>}
      </div>
    </div>
  );
}
