import { NotificationSettings } from "@/components/features/notifications/notification-settings";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useData } from "@/contexts/data-context";

export function NotificationsPage() {
  const { snapshot, markNotificationsRead } = useData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Your updates"
        description="In-app notifications, push preferences, and read state all in one place."
        action={
          <button className="text-sm font-semibold text-primary" onClick={() => markNotificationsRead()}>
            Mark all as read
          </button>
        }
      />

      <div className="space-y-4">
        {snapshot.notifications.map((notification) => (
          <Card key={notification.id} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{notification.title}</p>
                {!notification.is_read ? <Badge>New</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>

      <NotificationSettings />
    </div>
  );
}
