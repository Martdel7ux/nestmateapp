import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { TabBar, type NmTab } from "./TabBar";
import { HomeScreen } from "./screens/HomeScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MessagesScreen } from "./screens/MessagesScreen";
import "./nm-theme.css";

/**
 * NestMate v2 redesign shell — the new 5-tab experience.
 * Self-contained under [data-nm] so it coexists with the current app while the
 * rebuild is in progress. Mounted at /v2 on the redesign branch.
 */
export function RedesignShell() {
  const [tab, setTab] = useState<NmTab>("home");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
        {tab === "home" && <HomeScreen onNavigate={setTab} />}
        {tab === "explore" && <ExploreScreen />}
        {tab === "messages" && <MessagesScreen />}
        {tab === "profile" && <ProfileScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
