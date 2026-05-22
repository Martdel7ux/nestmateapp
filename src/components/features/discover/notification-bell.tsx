import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useDiscoverNotifications } from "@/hooks/use-discover-notifications";

export function NotificationBell() {
  const { unread } = useDiscoverNotifications();

  return (
    <Link
      to="/discover/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm text-foreground hover:brightness-110 transition-colors"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
