import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopNav } from "@/components/layout/top-nav";
import { useData } from "@/contexts/data-context";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

export function AppShell({ children }: { children: ReactNode }) {
  const { reloadData } = useData();
  const pullDistance = usePullToRefresh(reloadData);
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isAssistant = pathname === "/assistant";
  const isMessages = pathname === "/messages";
  const isChat = pathname.startsWith("/messages/");

  if (isAssistant) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <TopNav />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  // Messages list: locked viewport, no TopNav, BottomNav at bottom
  if (isMessages) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <main className="relative flex-1 overflow-hidden">
          {children}
          {/* Fade content into nav */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Individual chat: locked viewport, no nav chrome at all
  if (isChat) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  // Default scrollable layout — outer wrapper fills edge-to-edge,
  // individual sections handle their own top padding via TopNav or safeTop.
  return (
    <div className="relative min-h-dvh pb-[max(7rem,calc(env(safe-area-inset-bottom)+5rem))]">
      {pullDistance > 0 ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[env(safe-area-inset-top)]">
          <div className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            {pullDistance > 90 ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      ) : null}
      {!isHome && <TopNav />}
      <main className={isHome
        ? "pt-[env(safe-area-inset-top)] space-y-6 pb-8"
        : "container space-y-8 pb-8"
      }>
        {children}
      </main>
      {/* Fade content into nav as user scrolls down */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/60 to-transparent z-30" />
      <BottomNav />
    </div>
  );
}
