import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Cookie, FileText, ShieldCheck, UserCheck, X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface Section {
  icon: React.ElementType;
  title: string;
  content: string;
}

const sections: Section[] = [
  {
    icon: FileText,
    title: "Terms of Service",
    content:
      "By accessing NestMate you agree to use the platform solely for lawful purposes related to student accommodation and flatmate matching in Cyprus. You must be at least 18 years old. You agree not to post false, misleading, or fraudulent listings. NestMate reserves the right to suspend or terminate accounts that violate these terms. All content you post remains your responsibility.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Policy",
    content:
      "NestMate collects and processes your personal data (name, email, profile photo, city, university, accommodation preferences) strictly to operate the platform. Your data is stored securely on Supabase infrastructure within the EU. We do not sell your data to third parties. We share data only with other users as required for matching and messaging features, and with service providers who assist platform operations under strict data processing agreements.",
  },
  {
    icon: UserCheck,
    title: "Your GDPR Rights",
    content:
      "Under the General Data Protection Regulation (GDPR) you have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; restrict or object to certain processing; receive your data in a portable format; withdraw consent at any time without affecting lawfulness of prior processing. To exercise any right contact us at privacy@nestmate.app. You also have the right to lodge a complaint with the Cyprus Commissioner for Personal Data Protection.",
  },
  {
    icon: Cookie,
    title: "Cookie & Storage Policy",
    content:
      "NestMate uses browser local storage to remember your session, language preference, and GDPR consent. No third-party advertising cookies are set. If you use the app on a shared device, log out after each session to protect your data. You can clear stored data at any time through your browser or device settings, which will sign you out.",
  },
];

interface AccordionItemProps {
  section: Section;
  open: boolean;
  onToggle: () => void;
}

function AccordionItem({ section, open, onToggle }: AccordionItemProps) {
  const Icon = section.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/40"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={15} />
        </div>
        <span className="flex-1 text-sm font-semibold">{section.title}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <p className="px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {section.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface GdprSplashProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function GdprSplash({ onAccept, onDecline }: GdprSplashProps) {
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [declined, setDeclined] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDecline = () => {
    setDeclined(true);
    setTimeout(() => setDeclined(false), 3000);
    onDecline();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/20 via-primary/5 to-background">

      {/* ── Hero ── */}
      <div className="px-7 pt-10 pb-6">
        <Logo className="h-16 mb-6" />
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold leading-tight">Your Privacy Matters</h1>
            <p className="text-xs text-muted-foreground">GDPR-compliant · EU data protection</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Before you continue, please read and accept our policies. We are committed to protecting your personal data under EU law.
        </p>
      </div>

      {/* ── Scrollable body ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-t-[2.5rem] bg-background px-5 pt-7 pb-6 shadow-card"
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Legal agreements
        </p>

        <div className="space-y-2">
          {sections.map((section, i) => (
            <AccordionItem
              key={section.title}
              section={section}
              open={openSection === i}
              onToggle={() => setOpenSection(openSection === i ? null : i)}
            />
          ))}
        </div>

        {/* ── Data summary pill ── */}
        <div className="mt-5 rounded-2xl bg-muted/60 p-4">
          <p className="text-xs font-semibold text-foreground mb-2">What we collect &amp; why</p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
            {[
              ["Name &amp; email", "Account creation"],
              ["Profile photo", "Flatmate matching"],
              ["City / university", "Relevant listings"],
              ["Messages", "In-app chat"],
              ["Swipe activity", "Match algorithm"],
              ["Device storage", "Session &amp; prefs"],
            ].map(([data, purpose]) => (
              <div key={data} className="flex flex-col">
                <span className="font-medium text-foreground" dangerouslySetInnerHTML={{ __html: data }} />
                <span dangerouslySetInnerHTML={{ __html: purpose }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Consent checkbox ── */}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            I confirm that I have read and understood the Terms of Service, Privacy Policy, Cookie Policy, and my GDPR rights. I consent to the processing of my personal data as described above.
          </p>
        </label>

        {/* ── Decline notice ── */}
        <AnimatePresence>
          {declined && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <X size={15} className="mt-0.5 shrink-0" />
              <span>You must accept the agreements to use NestMate. Without consent we cannot create your account or show you listings.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Actions ── */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            disabled={!checked}
            onClick={onAccept}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-sky-400 text-base font-semibold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck size={18} />
            Accept &amp; Continue
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-border text-sm font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
          >
            Decline
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Questions? Contact us at{" "}
          <span className="font-medium text-primary">privacy@nestmate.app</span>
        </p>

        <div className="h-4" />
      </div>
    </div>
  );
}
