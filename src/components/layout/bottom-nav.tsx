import {
  BookOpen,
  Building2,
  Compass,
  HeartHandshake,
  Home,
  MessageCircle,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { useData } from "@/contexts/data-context";

const icons: Record<string, LucideIcon> = {
  Home,
  BookOpen,
  Compass,
  HeartHandshake,
  MessageCircle,
  Building2,
  ShieldCheck,
};

const studentNavItems = [
  { key: "navHome",      path: "/",          icon: "Home" },
  { key: "navFlatmates", path: "/flatmates",  icon: "HeartHandshake" },
  { key: "navDiscover",  path: "/discover",   icon: "Compass" },
  { key: "navStudy",     path: "/study",      icon: "BookOpen" },
  { key: "navMessages",  path: "/messages",   icon: "MessageCircle" },
] as const;

const landlordNavItems = [
  { key: "navHome",       path: "/",              icon: "Home" },
  { key: "navProperties", path: "/my-properties", icon: "Building2" },
  { key: "navDiscover",   path: "/discover",       icon: "Compass" },
  { key: "navStudy",      path: "/study",          icon: "BookOpen" },
  { key: "navMessages",   path: "/messages",       icon: "MessageCircle" },
] as const;

const adminNavItems = [
  { key: "navHome",     path: "/",         icon: "Home",          label: "Home" },
  { key: "navAdmin",    path: "/admin",    icon: "ShieldCheck",   label: "Admin" },
  { key: "navMessages", path: "/messages", icon: "MessageCircle", label: "Messages" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const { snapshot } = useData();
  const isLandlord = snapshot.profile.user_type === "landlord";

  const navItems = isAdmin
    ? adminNavItems
    : isLandlord
    ? landlordNavItems
    : studentNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md">
      <div
        className="flex items-stretch"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          const label = "label" in item ? item.label : t(item.key);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-1 flex-col items-center gap-0.5 pt-2.5"
            >
              {/* Icon with active pill */}
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200",
                  active ? "bg-primary/12" : ""
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 1.8}
                  className={cn(
                    "transition-colors duration-200",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </span>

              {/* Label */}
              <span
                className={cn(
                  "text-[9px] font-semibold leading-none tracking-wide transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
