import {
  HeartHandshake,
  Home,
  MessageCircle,
  UserRound,
  type LucideIcon
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { bottomNav } from "@/lib/constants";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  Home,
  HeartHandshake,
  MessageCircle,
  UserRound
};

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="glass flex items-center gap-1 rounded-[2rem] px-2 py-2 shadow-card">
        {bottomNav.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[1.5rem] px-5 py-2 text-[10px] font-semibold tracking-wide transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
