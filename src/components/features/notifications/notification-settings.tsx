import { useState } from "react";
import { Bell, BellOff, Heart, MessageCircle, ShieldCheck } from "lucide-react";

const SETTINGS_KEY = "nestmate-notif-settings";

interface NotifSettings {
  matchAlerts: boolean;
  messages: boolean;
  systemUpdates: boolean;
}

function loadSettings(): NotifSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { matchAlerts: true, messages: true, systemUpdates: true };
}

function saveSettings(settings: NotifSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        on ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotifSettings>(loadSettings);

  const update = (key: keyof NotifSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const allOff = !settings.matchAlerts && !settings.messages && !settings.systemUpdates;

  const rows = [
    {
      key: "matchAlerts" as const,
      icon: Heart,
      iconClass: "text-rose-500",
      bg: "bg-rose-500/10",
      title: "Match alerts",
      subtitle: "Get notified when someone likes your profile"
    },
    {
      key: "messages" as const,
      icon: MessageCircle,
      iconClass: "text-primary",
      bg: "bg-primary/10",
      title: "Messages",
      subtitle: "Receive alerts for new messages from matches"
    },
    {
      key: "systemUpdates" as const,
      icon: ShieldCheck,
      iconClass: "text-sky-500",
      bg: "bg-sky-500/10",
      title: "System updates",
      subtitle: "Profile approvals, listing changes and announcements"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold">Notifications</h3>
        <button
          type="button"
          onClick={() => {
            const mute = !allOff;
            const next = { matchAlerts: !mute, messages: !mute, systemUpdates: !mute };
            setSettings(next);
            saveSettings(next);
          }}
          className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition hover:bg-muted/80"
        >
          {allOff ? <Bell size={12} /> : <BellOff size={12} />}
          {allOff ? "Unmute all" : "Mute all"}
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card/60">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-center justify-between px-4 py-4 ${
              i < rows.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${row.bg}`}>
                <row.icon size={16} className={row.iconClass} />
              </div>
              <div>
                <p className="text-sm font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.subtitle}</p>
              </div>
            </div>
            <Toggle on={settings[row.key]} onChange={(v) => update(row.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
