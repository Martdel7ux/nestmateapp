import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useUpcomingEvents } from "@/hooks/use-upcoming-events";
import { UpcomingEventCard } from "./UpcomingEventCard";
import { Skeleton } from "@/components/ui/skeleton";

function EventSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-[20px]" style={{ height: "192px" }}>
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}

function EmptyState() {
  return (
    <Link
      to="/discover?type=event"
      className="block w-full overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-primary"
      style={{ height: "192px" }}
      aria-label="Browse upcoming events"
    >
      <div
        className="relative h-full w-full"
        style={{ background: "linear-gradient(135deg, var(--ambient-primary) 0%, var(--ambient-secondary) 60%, var(--ambient-accent) 100%)" }}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.60) 100%)" }}
        />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <p className="text-[18px] font-semibold text-white">No events lined up yet</p>
          <p className="mt-0.5 text-[13px] text-white/75">Discover what's happening in your city</p>
          <div
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white"
            style={{
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            Browse events
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function UpcomingEvents() {
  const { data: events, isLoading, isError } = useUpcomingEvents();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.44, duration: 0.35 }}
    >
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Upcoming Events</p>
        </div>
        <Link
          to="/discover?type=event&sort=upcoming"
          className="flex items-center gap-0.5 text-xs font-medium text-primary"
        >
          See all
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Vertical stack */}
      <div className="flex flex-col gap-4">
        {isLoading && (
          <>
            <EventSkeleton />
            <EventSkeleton />
          </>
        )}

        {!isLoading && !isError && events && events.length > 0 &&
          events.map((event, i) => (
            <UpcomingEventCard key={event.id} event={event} index={i} />
          ))
        }

        {!isLoading && (events?.length === 0 || isError) && (
          <EmptyState />
        )}
      </div>
    </motion.section>
  );
}
