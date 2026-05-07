import { Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { useData } from "@/contexts/data-context";

export function TopNav() {
  const { pathname } = useLocation();
  const { snapshot } = useData();
  const unread = snapshot.notifications.filter((item) => !item.is_read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4">
      <Link to="/">
        <Logo className="h-12" />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition"
          aria-current={pathname === "/notifications" ? "page" : undefined}
        >
          <Bell size={17} />
          {unread > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </Link>
        <Link to="/profile">
          <Avatar
            name={snapshot.profile.full_name}
            src={snapshot.profile.avatar_url}
            className="h-9 w-9"
          />
        </Link>
      </div>
    </header>
  );
}
