import { Link } from "react-router-dom";
import { Mail, MessageCircle, MessageSquare } from "lucide-react";

const SUPPORT_EMAIL    = "support@nestmate.app";
const SUPPORT_WHATSAPP = "+35799000000"; // replace with real number

interface Props {
  subjectHint?: string;
}

export function ContactChannels({ subjectHint }: Props) {
  const waText = encodeURIComponent(
    `Hi, I need help with Nestmate${subjectHint ? ` — ${subjectHint}` : ""}.`
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      <Link
        to={`/profile/help/contact${subjectHint ? `?subject=${encodeURIComponent(subjectHint)}` : ""}`}
        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:bg-muted/40 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <MessageSquare size={18} className="text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">Send a message</span>
      </Link>

      <a
        href={`mailto:${SUPPORT_EMAIL}${subjectHint ? `?subject=${encodeURIComponent(subjectHint)}` : ""}`}
        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:bg-muted/40 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
          <Mail size={18} className="text-blue-500" />
        </div>
        <span className="text-xs font-semibold text-foreground">Email us</span>
      </a>

      <a
        href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, "")}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:bg-muted/40 active:scale-95"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
          <MessageCircle size={18} className="text-emerald-500" />
        </div>
        <span className="text-xs font-semibold text-foreground">WhatsApp</span>
      </a>
    </div>
  );
}
