import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useData } from "@/contexts/data-context";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

export function AppShell({ children }: { children: ReactNode }) {
  const { reloadData } = useData();
  const pullDistance = usePullToRefresh(reloadData);
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isChat = pathname.startsWith("/messages/");

  // Pages that manage their own internal scroll — need flex h-dvh container
  // Assistant has no BottomNav; all others do
  const isAssistant = pathname === "/assistant";
  const isFullHeight =
    isAssistant ||
    pathname === "/messages" ||
    pathname.startsWith("/discover") ||
    pathname === "/study" ||
    pathname.startsWith("/study/") ||
    pathname === "/household" ||
    pathname.startsWith("/household/") ||
    pathname === "/rent" ||
    pathname.startsWith("/rent/");

  if (isChat) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  if (isFullHeight) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
        {!isAssistant && <BottomNav />}
      </div>
    );
  }

  // Default scrollable layout — pages handle their own AppHeader
  return (
    <div className="relative min-h-dvh pb-28">
      {pullDistance > 0 ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[env(safe-area-inset-top)]">
          <div className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            {pullDistance > 90 ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      ) : null}
      <main className={isHome ? "pt-[env(safe-area-inset-top)]" : ""}>
        {children}
      </main>
      {!isHome && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent z-30" />
      )}
      <BottomNav />
    </div>
  );
}
