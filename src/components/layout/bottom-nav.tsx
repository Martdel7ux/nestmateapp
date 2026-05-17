import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  MessageCircle,
  ShieldCheck,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { useData } from "@/contexts/data-context";

const icons: Record<string, LucideIcon> = { Home, Compass, MessageCircle, ShieldCheck, User, Wallet };

const studentNavItems = [
  { key: "navHome",      path: "/",          icon: "Home" },
  { key: "navDiscover",  path: "/discover",  icon: "Compass" },
  { key: "navHousehold", path: "/household", icon: "Wallet",        label: "Bills" },
  { key: "navMessages",  path: "/messages",  icon: "MessageCircle" },
  { key: "navProfile",   path: "/profile",   icon: "User" },
] as const;

const landlordNavItems = [
  { key: "navHome",      path: "/",          icon: "Home" },
  { key: "navDiscover",  path: "/discover",  icon: "Compass" },
  { key: "navHousehold", path: "/household", icon: "Wallet",        label: "Bills" },
  { key: "navMessages",  path: "/messages",  icon: "MessageCircle" },
  { key: "navProfile",   path: "/profile",   icon: "User" },
] as const;

const adminNavItems = [
  { key: "navHome",     path: "/",        icon: "Home",        label: "Home" },
  { key: "navAdmin",    path: "/admin",   icon: "ShieldCheck", label: "Admin" },
  { key: "navMessages", path: "/messages",icon: "MessageCircle",label: "Messages" },
  { key: "navProfile",  path: "/profile", icon: "User",        label: "Profile" },
] as const;

const springTransition  = { type: "spring", stiffness: 420, damping: 32 } as const;
const slideTransition   = { type: "spring", stiffness: 320, damping: 36 } as const;

function readNavHidden(): boolean {
  try { return localStorage.getItem("nestmate_nav_hidden") === "true"; }
  catch { return false; }
}

export function BottomNav() {
  const { pathname }   = useLocation();
  const { t }          = useI18n();
  const { isAdmin }    = useAuth();
  const { snapshot }   = useData();
  const isLandlord     = snapshot.profile.user_type === "landlord";

  const navItems = isAdmin ? adminNavItems : isLandlord ? landlordNavItems : studentNavItems;

  const unreadMessages = snapshot.notifications.filter(
    (n) => n.type === "match" && !n.is_read
  ).length;

  // Desktop sidebar collapsed state — persisted in localStorage
  const [sidebarHidden, setSidebarHidden] = useState<boolean>(readNavHidden);

  function toggleSidebar() {
    setSidebarHidden((prev) => {
      const next = !prev;
      try { localStorage.setItem("nestmate_nav_hidden", String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return (
    <>
      {/* ── Mobile: floating liquid-glass capsule ── */}
      <nav
        className="fixed inset-x-4 bottom-4 z-40 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="glass-nav rounded-full px-2 py-1.5">
          <div className="flex items-center">
            {navItems.map((item) => {
              const Icon     = icons[item.icon];
              const isActive =
                pathname === item.path ||
                (item.path !== "/" && pathname.startsWith(item.path));
              const label    = "label" in item ? item.label : t(item.key);
              const showBadge = item.icon === "MessageCircle" && unreadMessages > 0;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[44px] justify-center"
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-x-1 inset-y-0 rounded-full bg-primary/10"
                      transition={springTransition}
                    />
                  )}

                  <motion.span
                    className="relative z-10"
                    whileTap={{ scale: 0.88 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.2 : 1.7}
                      className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-primary" : "text-[var(--text-t)]"
                      )}
                    />
                    {showBadge && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                    )}
                  </motion.span>

                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold tracking-wide transition-colors duration-200",
                      isActive ? "text-primary" : "text-[var(--text-t)]"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Desktop: collapsible vertical liquid-glass sidebar ── */}
      <motion.nav
        className="fixed left-4 top-1/2 z-40 hidden lg:flex"
        style={{ translateY: "-50%" } as React.CSSProperties}
        initial={false}
        animate={{ x: sidebarHidden ? -104 : 0 }}
        transition={slideTransition}
      >
        <div className="glass-nav flex flex-col gap-1 rounded-2xl px-2 py-3">
          {navItems.map((item) => {
            const Icon     = icons[item.icon];
            const isActive =
              pathname === item.path ||
              (item.path !== "/" && pathname.startsWith(item.path));
            const label    = "label" in item ? item.label : t(item.key);
            const showBadge = item.icon === "MessageCircle" && unreadMessages > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-3 py-2.5 min-w-[52px] min-h-[52px] justify-center rounded-xl"
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill-desktop"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={springTransition}
                  />
                )}
                <motion.span
                  className="relative z-10"
                  whileTap={{ scale: 0.88 }}
                  transition={{ duration: 0.1 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    className={cn(
                      "transition-colors duration-200",
                      isActive ? "text-primary" : "text-[var(--text-t)]"
                    )}
                  />
                  {showBadge && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </motion.span>
                <span
                  className={cn(
                    "relative z-10 text-[9px] font-semibold tracking-wide transition-colors duration-200",
                    isActive ? "text-primary" : "text-[var(--text-t)]"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Collapse button — always at bottom of sidebar */}
          <button
            onClick={toggleSidebar}
            title="Hide navigation"
            aria-label="Hide navigation sidebar"
            className="mt-1 flex items-center justify-center rounded-xl px-3 py-2 transition-colors hover:bg-foreground/[0.06] active:bg-foreground/[0.09]"
          >
            <ChevronLeft
              size={15}
              className="text-[var(--text-t)] transition-colors hover:text-foreground"
            />
          </button>
        </div>
      </motion.nav>

      {/* ── Desktop: reveal tab when sidebar is hidden ── */}
      <AnimatePresence>
        {sidebarHidden && (
          <motion.button
            key="nav-reveal"
            className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 lg:flex"
            initial={{ x: -32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -32, opacity: 0 }}
            transition={slideTransition}
            onClick={toggleSidebar}
            title="Show navigation"
            aria-label="Show navigation sidebar"
          >
            {/* Thin pill tab attached to the left edge */}
            <div
              className="flex items-center justify-center rounded-r-xl py-5 px-1.5"
              style={{
                background: "var(--nav-fill)",
                backdropFilter: "blur(44px) saturate(220%)",
                WebkitBackdropFilter: "blur(44px) saturate(220%)",
                border: "1px solid var(--nav-border)",
                borderLeft: "none",
                boxShadow: "var(--nav-shadow)",
              }}
            >
              <ChevronRight
                size={13}
                className="text-[var(--text-t)]"
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
