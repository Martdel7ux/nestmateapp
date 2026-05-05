import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopNav } from "@/components/layout/top-nav";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

export function AppShell({ children }: { children: ReactNode }) {
  const pullDistance = usePullToRefresh();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="relative min-h-screen pb-28">
      {pullDistance > 0 ? (
        <div className="fixed inset-x-0 top-0 z-50 flex justify-center">
          <div className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            {pullDistance > 90 ? "Release to refresh" : "Pull to refresh"}
          </div>
        </div>
      ) : null}
      {!isHome && <TopNav />}
      <main className={isHome ? "space-y-6 pb-8" : "container space-y-8 pb-8"}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
