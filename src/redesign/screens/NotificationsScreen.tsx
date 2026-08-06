import { useEffect } from "react";
import { useData } from "@/contexts/data-context";
import { IconArrowLeft, IconHeart, IconMessages, IconBell, IconShield, IconKey } from "../icons";
import { stickyControl } from "../StickyBar";
import type { NmTab } from "../TabBar";
import type { NotificationItem } from "@/types/supabase";

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604_800) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function iconFor(type: NotificationItem["type"]): { Icon: (p: { size?: number }) => JSX.Element; bg: string; fg: string } {
  switch (type) {
    case "match": return { Icon: IconHeart, bg: "var(--nm-coral-soft)", fg: "var(--nm-coral)" };
    case "message": return { Icon: IconMessages, bg: "var(--nm-soft)", fg: "var(--nm-accent)" };
    case "saved_property":
    case "property_approved": return { Icon: IconKey, bg: "var(--nm-mint-soft)", fg: "#0b7a5a" };
    case "verification": return { Icon: IconShield, bg: "var(--nm-mint-soft)", fg: "#0b7a5a" };
    default: return { Icon: IconBell, bg: "var(--nm-surface2)", fg: "var(--nm-muted)" };
  }
}

/** Where a notification takes you when tapped. */
function destinationFor(type: NotificationItem["type"]): NmTab | null {
  if (type === "message" || type === "match") return "messages";
  if (type === "saved_property" || type === "property_approved") return "explore";
  return null;
}

export function NotificationsScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (t: NmTab) => void }) {
  const { snapshot, markNotificationsRead } = useData();
  const notifs = snapshot.notifications ?? [];

  // Opening the panel clears the unread badge.
  useEffect(() => { markNotificationsRead(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 20px 20px", animation: "nmFade .3s ease-out" }}>
      <button type="button" className="nm-icon-btn nm-press" onClick={onBack} aria-label="Back" style={{ ...stickyControl, marginBottom: 16 }}>
        <IconArrowLeft />
      </button>
      <div style={{ fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Notifications</div>

      {notifs.length === 0 ? (
        <div className="nm-card nm-card-lg" style={{ marginTop: 22, padding: 30, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 99, background: "var(--nm-surface2)", color: "var(--nm-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconBell size={24} />
          </span>
          <div style={{ fontSize: 15, fontWeight: 600 }}>You're all caught up</div>
          <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 250 }}>Matches, messages and updates will show up here.</p>
        </div>
      ) : (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {notifs.map((n) => {
            const { Icon, bg, fg } = iconFor(n.type);
            const dest = destinationFor(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => { if (dest) onNavigate(dest); }}
                className={dest ? "nm-press" : undefined}
                style={{ all: "unset", cursor: dest ? "pointer" : "default", display: "flex", boxSizing: "border-box", width: "100%", alignItems: "flex-start", gap: 13, background: "var(--nm-surface)", borderRadius: "var(--nm-r-md)", padding: "14px 16px", boxShadow: "var(--nm-elev)" }}
              >
                <span style={{ width: 40, height: 40, flex: "none", borderRadius: 12, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={19} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{n.title}</span>
                  {n.body && <span style={{ display: "block", fontSize: 12.5, color: "var(--nm-muted)", marginTop: 3, lineHeight: 1.45 }}>{n.body}</span>}
                  <span style={{ display: "block", fontSize: 11, color: "var(--nm-muted)", marginTop: 6 }}>{timeAgo(n.created_at)}</span>
                </span>
                {!n.is_read && <span style={{ width: 8, height: 8, flex: "none", borderRadius: 99, background: "var(--nm-coral)", marginTop: 6 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
