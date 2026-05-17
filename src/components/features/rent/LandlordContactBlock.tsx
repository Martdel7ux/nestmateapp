import { Phone, Mail, MessageCircle } from "lucide-react";

interface Props {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
}

export function LandlordContactBlock({ name, phone, email, whatsapp }: Props) {
  if (!name && !phone && !email && !whatsapp) return null;

  const wa = whatsapp || phone;

  return (
    <div className="rounded-2xl bg-background/70 dark:bg-slate-800/60 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Landlord</p>
      {name && <p className="font-semibold text-foreground">{name}</p>}
      <div className="flex gap-2">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary"
          >
            <Phone size={14} /> Call
          </a>
        )}
        {wa && (
          <a
            href={`https://wa.me/${wa.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 py-2.5 text-xs font-semibold text-emerald-600"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2.5 text-xs font-semibold text-foreground"
          >
            <Mail size={14} /> Email
          </a>
        )}
      </div>
    </div>
  );
}
