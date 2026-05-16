import { useRef, useState } from "react";
import { Heart, CalendarPlus, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)",
];

export function UpcomingEventCard({ event, index }: Props) {
  const navigate = useNavigate();
  const [showCal, setShowCal] = useState(false);
  const calBtnRef = useRef<HTMLButtonElement>(null!);
  const { mutate: toggleFav, isPending } = useToggleEventFavourite(
    event.id,
    event.is_favourited
  );

  const fallback = GRADIENT_FALLBACKS[index % GRADIENT_FALLBACKS.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.32 }}
      tabIndex={0}
      role="link"
      aria-label={`View event: ${event.title}`}
      onClick={() => navigate(`/discover/${event.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") navigate(`/discover/${event.id}`); }}
      className="event-card relative w-full h-[192px] cursor-pointer overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-primary"
    >
      {/* Background image or gradient fallback */}
      <div className="absolute inset-0 overflow-hidden rounded-[20px]">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt=""
            className="event-card-image h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full" style={{ background: fallback }} />
        )}
        {/* Dark gradient overlay — transparent top, dark bottom */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.74) 100%)" }}
        />
      </div>

      {/* Content — pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10">
        {/* Title */}
        <p className="line-clamp-2 text-[18px] font-semibold leading-snug text-white mb-1.5">
          {event.title}
        </p>

        {/* Meta row */}
        {(event.starts_at || event.location) && (
          <div className="mb-3 flex items-center gap-1 text-[12px] text-white/85">
            {event.starts_at && (
              <>
                <Clock size={12} className="flex-shrink-0" />
                <span>{formatTime(event.starts_at)}</span>
              </>
            )}
            {event.starts_at && event.location && (
              <span className="mx-1 text-white/45">·</span>
            )}
            {event.location && (
              <>
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate max-w-[160px]">{event.location}</span>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Save / Unsave */}
          <button
            aria-label={event.is_favourited ? "Unsave event" : "Save event"}
            aria-pressed={event.is_favourited}
            disabled={isPending}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleFav(); }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Heart
              size={13}
              className={event.is_favourited ? "fill-rose-400 text-rose-400" : "text-white"}
            />
            {event.is_favourited ? "Saved" : "Save"}
          </button>

          {/* Add to calendar */}
          <button
            ref={calBtnRef}
            aria-label="Add to calendar"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowCal((v) => !v); }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white transition-transform active:scale-95"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <CalendarPlus size={13} />
            Add to Calendar
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
