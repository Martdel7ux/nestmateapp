import { Link } from "react-router-dom";
import { ChevronRight, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useUpcomingEvents } from "@/hooks/use-upcoming-events";
import { UpcomingEventCard } from "./UpcomingEventCard";
import { Skeleton } from "@/components/ui/skeleton";

function EventSkeleton() {
  return (
    <div className="flex-shrink-0 w-[272px] sm:w-[304px] overflow-hidden rounded-2xl"
      style={{ border: "1px solid var(--glass-border)" }}>
      <Skeleton className="h-[96px] w-full rounded-none" />
      <div className="px-3 pt-2.5 pb-3 space-y-2"
        style={{ background: "var(--glass-fill)" }}>
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-2/5 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-full mt-1" />
      </div>
    </div>
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
      {/* Header */}
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

      {/* Horizontal scroll strip */}
      <div className="-mx-5 px-5">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {isLoading && (
            <>
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </>
          )}

          {!isLoading && !isError && events && events.length > 0 &&
            events.map((event, i) => (
              <div key={event.id} className="snap-start">
                <UpcomingEventCard event={event} index={i} />
              </div>
            ))
          }

          {!isLoading && (events?.length === 0 || isError) && (
            <div className="glass-card flex w-full min-h-[120px] items-center justify-center rounded-2xl mx-0">
              <div className="flex flex-col items-center gap-2 py-6">
                <CalendarDays size={28} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No upcoming events right now</p>
                <Link
                  to="/discover?type=event"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Browse all events
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
