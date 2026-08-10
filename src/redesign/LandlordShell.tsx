import { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { TabBar, LANDLORD_TABS, type LandlordTab } from "./TabBar";
import { ErrorBoundary } from "./ErrorBoundary";
import { LandlordHome } from "./screens/LandlordHome";
import { LandlordListings } from "./screens/LandlordListings";
import { MessagesScreen } from "./screens/MessagesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import "./nm-theme.css";

/** NestMate v2 shell for landlord accounts — manage listings, chat, profile. */
export function LandlordShell() {
  const [tab, setTab] = useState<LandlordTab>("home");
  const [addToken, setAddToken] = useState(0);
  const [hideTabBar, setHideTabBar] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const openAdd = () => { setAddToken((t) => t + 1); setTab("listings"); };

  return (
    <div data-nm={isDark ? "dark" : "light"} style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--nm-bg)" }}>
      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }} className="nm-hscroll-none">
        <ErrorBoundary key={tab}>
          {tab === "home" && <LandlordHome onNavigate={setTab} onAddListing={openAdd} />}
          {tab === "listings" && <LandlordListings addToken={addToken} />}
          {tab === "messages" && <MessagesScreen onChatOpenChange={setHideTabBar} />}
          {tab === "profile" && <ProfileScreen />}
        </ErrorBoundary>
      </main>

      {!hideTabBar && <TabBar tabs={LANDLORD_TABS} active={tab} onChange={(t) => setTab(t as LandlordTab)} />}
    </div>
  );
}
