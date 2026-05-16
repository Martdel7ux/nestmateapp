import { ArrowLeft, Bell } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useDiscoverNotifications } from "@/hooks/use-discover-notifications";

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function DiscoverNotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, isLoading, markRead } = useDiscoverNotifications();

  useEffect(() => {
    markRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 px-5 pb-5 pt-4 dark:bg-primary/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bell size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              We'll notify you when new opportunities match your preferences.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 pt-2">
            {notifications.map((n) => {
              const content = (
                <div className={`flex gap-3 px-5 py-3 ${!n.read_at ? "bg-primary/5" : ""}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bell size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm leading-snug">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{timeLabel(n.created_at)}</p>
                  </div>
                  {!n.read_at && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );

              return n.opportunity_id ? (
                <Link key={n.id} to={`/discover/${n.opportunity_id}`}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
