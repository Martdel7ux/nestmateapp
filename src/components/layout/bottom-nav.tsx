import {
  Building2,
  Compass,
  HeartHandshake,
  Home,
  MessageCircle,
  ShieldCheck,
  UserRound,
  type LucideIcon
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { useData } from "@/contexts/data-context";

const icons: Record<string, LucideIcon> = {
  Home,
  Compass,
  HeartHandshake,
  MessageCircle,
  UserRound,
  Building2,
  ShieldCheck,
};

const studentNavItems = [
  { key: "navHome",      path: "/",          icon: "Home" },
  { key: "navFlatmates", path: "/flatmates",  icon: "HeartHandshake" },
  { key: "navDiscover",  path: "/discover",   icon: "Compass" },
  { key: "navMessages",  path: "/messages",   icon: "MessageCircle" },
  { key: "navProfile",   path: "/profile",    icon: "UserRound" },
] as const;

const landlordNavItems = [
  { key: "navHome",        path: "/",               icon: "Home" },
  { key: "navProperties",  path: "/my-properties",  icon: "Building2" },
  { key: "navDiscover",    path: "/discover",        icon: "Compass" },
  { key: "navMessages",    path: "/messages",        icon: "MessageCircle" },
  { key: "navProfile",     path: "/profile",         icon: "UserRound" },
] as const;

const adminNavItems = [
  { key: "navHome",    path: "/",        icon: "Home",       label: "Home" },
  { key: "navAdmin",   path: "/admin",   icon: "ShieldCheck", label: "Admin" },
  { key: "navMessages",path: "/messages",icon: "MessageCircle", label: "Messages" },
  { key: "navProfile", path: "/profile", icon: "UserRound",  label: "Profile" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { snapshot } = useData();
  const isLandlord = snapshot.profile.user_type === "landlord";

  if (isAdmin) {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="glass flex items-center gap-1 rounded-[2rem] px-2 py-2 shadow-card">
          {adminNavItems.map((item) => {
            const Icon = icons[item.icon];
            const active = pathname === item.path || (item.path === "/admin" && pathname.startsWith("/admin"));
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

  const navItems = isLandlord ? landlordNavItems : studentNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="glass flex items-center gap-1 rounded-[2rem] px-2 py-2 shadow-card">
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
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
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
