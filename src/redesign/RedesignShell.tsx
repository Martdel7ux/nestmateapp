import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { TabBar, type NmTab } from "./TabBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ErrorBoundary } from "./ErrorBoundary";
import type { ModuleIconName } from "./icons";
import "./nm-theme.css";

/**
 * NestMate v2 redesign shell — the new 5-tab experience.
 * Self-contained under [data-nm] so it coexists with the current app while the
 * rebuild is in progress. Mounted at /v2 on the redesign branch.
 */
export function RedesignShell() {
  const [tab, setTab] = useState<NmTab>("home");
  const [exploreTarget, setExploreTarget] = useState<{ module: ModuleIconName; token: number; focus?: string } | null>(null);
  const [hideTabBar, setHideTabBar] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Navigate to a tab, optionally deep-linking Explore straight to a module.
  // A plain Explore visit (no module) clears any target so it opens the hub.
  const navigate = (next: NmTab, exploreModule?: ModuleIconName, focus?: string) => {
    if (next === "explore") {
      setExploreTarget((prev) => (exploreModule ? { module: exploreModule, token: (prev?.token ?? 0) + 1, focus } : null));
    }
    setTab(next);
  };

  return (
    <div
      data-nm={isDark ? "dark" : "light"}
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--nm-bg)",
      }}
    >
      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="nm-hscroll-none">
        {/* Keyed by tab so a crash on one screen is isolated and clears on switch. */}
        <ErrorBoundary key={tab}>
          {tab === "home" && <HomeScreen onNavigate={navigate} />}
          {tab === "explore" && <ExploreScreen target={exploreTarget} onImmersiveChange={setHideTabBar} />}
          {tab === "messages" && <MessagesScreen onChatOpenChange={setHideTabBar} />}
          {tab === "profile" && <ProfileScreen />}
        </ErrorBoundary>
      </main>

      {!hideTabBar && <TabBar active={tab} onChange={navigate} />}
    </div>
  );
}
