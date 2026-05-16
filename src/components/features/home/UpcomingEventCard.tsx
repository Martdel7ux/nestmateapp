import { useRef, useState } from "react";
import { Heart, CalendarPlus, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { AddToCalendarPopover } from "./AddToCalendarPopover";
import { useToggleEventFavourite } from "@/hooks/use-upcoming-events";
import type { UpcomingEvent } from "@/lib/upcoming-events-api";

interface Props {
  event: UpcomingEvent;
  index: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function DateChip({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 min-w-[42px]"
      style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}>
      <span className="text-[20px] font-bold leading-none text-foreground">{d.getDate()}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
        {MONTH_SHORT[d.getMonth()]}
      </span>
    </div>
  );
}

const GRADIENT_FALLBACKS = [
  "from-sky-500/30 to-violet-500/20",
  "from-emerald-500/30 to-teal-500/20",
  "from-orange-500/30 to-pink-500/20",
  "from-violet-500/30 to-blue-500/20",
  "from-rose-500/30 to-orange-500/20",
];

export function UpcomingEventCard({ event, index }: Props) {
  const [showCal, setShowCal] = useState(false);
  const calBtnRef = useRef<HTMLButtonElement>(null!);
  const { mutate: toggleFav, isPending } = useToggleEventFavourite(
    event.id,
    event.is_favourited
  );

  const gradient = GRADIENT_FALLBACKS[index % GRADIENT_FALLBACKS.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * index, duration: 0.32 }}
      className="relative flex-shrink-0 w-[272px] sm:w-[304px] overflow-hidden rounded-2xl border border-[var(--glass-border)]"
    >
      {/* Banner */}
      <div className="relative h-[96px] w-full overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
        {/* Dark scrim for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Date chip — top left */}
        {event.starts_at && (
          <div className="absolute left-3 top-3">
            <DateChip iso={event.starts_at} />
          </div>
        )}

        {/* Save heart — top right */}
        <button
          aria-label={event.is_favourited ? "Unsave event" : "Save event"}
          disabled={isPending}
          onClick={() => toggleFav()}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-50"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
        >
          <Heart
            size={15}
            className={event.is_favourited ? "fill-rose-400 text-rose-400" : "text-white"}
          />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-3"
        style={{ background: "var(--glass-fill)", backdropFilter: `blur(var(--glass-blur))`, WebkitBackdropFilter: `blur(var(--glass-blur))` }}>
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
          {event.title}
        </p>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {event.starts_at && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock size={10} />
              {formatTime(event.starts_at)}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[130px]">
              <MapPin size={10} />
              {event.location}
            </span>
          )}
        </div>

        {/* Add to calendar */}
        <div className="mt-2.5 flex items-center justify-between">
          {event.organization && (
            <span className="text-[10px] text-muted-foreground/70 truncate max-w-[130px]">
              {event.organization}
            </span>
          )}
          <button
            ref={calBtnRef}
            aria-label="Add to calendar"
            onClick={() => setShowCal((v) => !v)}
            className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 active:bg-primary/15"
            style={{ border: "1px solid var(--glass-border)" }}
          >
            <CalendarPlus size={12} />
            Add
          </button>
        </div>
      </div>

      {showCal && (
        <AddToCalendarPopover
          event={event}
          onClose={() => setShowCal(false)}
          anchorRef={calBtnRef}
        />
      )}
    </motion.article>
  );
}
