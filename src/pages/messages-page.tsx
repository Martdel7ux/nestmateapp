import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useData } from "@/contexts/data-context";

export function MessagesPage() {
  const { snapshot } = useData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Matched conversations"
        description="Realtime presence and unread badges are ready to connect to Supabase Realtime."
      />
      <div className="space-y-4">
        {snapshot.matches.map((match) => {
          const messages = snapshot.messages.filter((message) => message.match_id === match.id);
          const lastMessage = messages[messages.length - 1];
          const other = snapshot.flatmates.find((item) => item.user_id === match.user_b)?.profile;
          const unread = messages.filter(
            (message) => !message.read && message.sender_id !== snapshot.profile.id
          ).length;
          return (
            <Link key={match.id} to={`/messages/${match.id}`}>
              <Card className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={other?.full_name ?? "Flatmate"} src={other?.avatar_url} />
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>
                  <div>
                    <p className="font-semibold">{other?.full_name ?? "Flatmate"}</p>
                    <p className="text-sm text-muted-foreground">
                      {lastMessage?.content ?? "Start the conversation"}
                    </p>
                  </div>
                </div>
                {unread > 0 ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {unread}
                  </span>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
