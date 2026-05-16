import { useRef, useEffect, useState } from "react";
import { Calendar, Download, ExternalLink } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  buildOutlookUrl,
  buildIcsUrl,
} from "@/lib/calendar-links";
import type { UpcomingEvent } from "@/lib/upcoming-events-api";

interface Props {
  event: UpcomingEvent;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

const OPTIONS = [
  { id: "google", label: "Google Calendar", Icon: ExternalLink, color: "text-blue-500" },
  { id: "outlook", label: "Outlook", Icon: ExternalLink, color: "text-sky-500" },
  { id: "apple", label: "Apple / iCal", Icon: Download, color: "text-gray-500 dark:text-gray-300" },
  { id: "ics", label: "Download .ics", Icon: Download, color: "text-emerald-500" },
] as const;

export function AddToCalendarPopover({ event, onClose, anchorRef }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ bottom: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !anchorRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function getUrl(id: (typeof OPTIONS)[number]["id"]): string {
    switch (id) {
      case "google":  return buildGoogleCalendarUrl(event);
      case "outlook": return buildOutlookUrl(event);
      case "apple":   return buildIcsUrl(event.id);
      case "ics":     return buildIcsUrl(event.id);
    }
  }

  function handleOption(id: (typeof OPTIONS)[number]["id"]) {
    const url = getUrl(id);
    if (url === "#") return;
    if (id === "apple" || id === "ics") {
      // Force download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.replace(/\s+/g, "_")}.ics`;
      a.click();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    onClose();
  }

  if (!pos) return null;

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="Add to calendar"
      className="fixed z-50 w-52 overflow-hidden rounded-2xl border border-[var(--glass-border)] shadow-xl"
      style={{
        bottom: pos.bottom,
        left: pos.left,
        background: "var(--glass-fill)",
        backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
        WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
      }}
    >
      <div className="px-3 py-2.5 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Add to calendar
          </p>
        </div>
      </div>
      <ul className="py-1">
        {OPTIONS.map(({ id, label, Icon, color }) => (
          <li key={id}>
            <button
              role="menuitem"
              onClick={() => handleOption(id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.05] active:bg-foreground/[0.09]"
            >
              <Icon size={14} className={color} />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
