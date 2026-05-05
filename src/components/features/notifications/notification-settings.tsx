import { BellRing, Smartphone, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function NotificationSettings() {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-2xl">Notification settings</h3>
        <p className="text-sm text-muted-foreground">
          Push subscriptions are stored in Supabase and delivered via the service worker.
        </p>
      </div>
      {[
        {
          title: "Match alerts",
          subtitle: "Get notified when someone likes you back.",
          icon: BellRing
        },
        {
          title: "Message pushes",
          subtitle: "Receive Web Push notifications for unread chats.",
          icon: Smartphone
        },
        {
          title: "Landlord updates",
          subtitle: "Know when verification or listing status changes.",
          icon: Volume2
        }
      ].map((item, index) => (
        <div key={item.title} className="flex items-center justify-between rounded-[1.5rem] bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            <item.icon className="text-primary" size={18} />
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
            </div>
          </div>
          <Switch checked={index !== 2} />
        </div>
      ))}
    </Card>
  );
}
