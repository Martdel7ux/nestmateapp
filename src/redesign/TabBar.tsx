import { IconHome, IconExplore, IconMessages, IconProfile } from "./icons";

export type NmTab = "home" | "explore" | "messages" | "profile";

const TABS: { key: NmTab; label: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "explore", label: "Explore", Icon: IconExplore },
  { key: "messages", label: "Messages", Icon: IconMessages },
  { key: "profile", label: "Profile", Icon: IconProfile },
];

/** Floating frosted tab bar from the prototype. */
export function TabBar({ active, onChange }: { active: NmTab; onChange: (t: NmTab) => void }) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 20,
        padding: "0 12px calc(18px + env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 460,
          padding: "10px 6px",
          borderRadius: 28,
          background: "color-mix(in srgb, var(--nm-surface) 82%, transparent)",
          border: "1px solid var(--nm-line)",
          boxShadow: "0 10px 30px rgba(17,24,39,.14)",
          display: "flex",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              style={{
                all: "unset",
                cursor: "pointer",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "5px 0",
                color: on ? "var(--nm-accent)" : "var(--nm-muted)",
              }}
            >
              <Icon size={23} />
              <span style={{ font: "500 10px Inter, sans-serif" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
