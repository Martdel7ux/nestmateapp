import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AppHeader } from "@/components/layout/app-header";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import { useAuth } from "@/contexts/auth-context";
import { usePresence } from "@/hooks/use-presence";
import type { Profile } from "@/types/supabase";

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function ConversationRow({
  matchId,
  profile,
  profileImageUrl,
  lastMessage,
  lastTime,
  unread,
  expired,
  isOnline,
}: {
  matchId: string;
  profile: Profile;
  profileImageUrl: string | null;
  lastMessage: string;
  lastTime: string | null;
  unread: number;
  expired: boolean;
  isOnline: boolean;
}) {
  return (
    <Link
      to={`/messages/${matchId}`}
      className={`flex items-center gap-3 px-5 py-3 transition active:bg-muted/50 ${expired ? "opacity-50" : ""}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`h-14 w-14 overflow-hidden rounded-full ${expired ? "grayscale" : ""}`}>
          <Avatar
            name={profile.full_name}
            src={profileImageUrl ?? profile.avatar_url}
            className="h-full w-full"
          />
        </div>
        {!expired && isOnline && (
          <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${expired ? "text-muted-foreground" : "text-foreground"}`}>
          {profile.full_name}
        </p>
        <p className="truncate text-sm text-muted-foreground">{lastMessage}</p>
      </div>

      {/* Time + unread badge */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {lastTime && (
          <span className={`text-xs ${unread > 0 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            {lastTime}
          </span>
        )}
        {unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </div>
    </Link>
  );
}

export function MessagesPage() {
  const { snapshot, blockedUserIds } = useData();
  const { user } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const onlineUserIds = usePresence(user?.id);

  const conversations = snapshot.matches
    .map((match) => {
      const otherId = match.user_a === snapshot.profile.id ? match.user_b : match.user_a;
      const otherListing = snapshot.flatmates.find((f) => f.user_id === otherId);
      const profile = otherListing?.profile ?? null;
      const profileImageUrl = otherListing?.profile_image_url ?? null;
      const messages = snapshot.messages.filter((m) => m.match_id === match.id);
      const lastMessage = messages[messages.length - 1];
      const unread = messages.filter(
        (m) => !m.read && m.sender_id !== snapshot.profile.id
      ).length;
      const lastActivityTime = lastMessage?.created_at ?? match.created_at;
      const hoursAgo = (Date.now() - new Date(lastActivityTime).getTime()) / 3_600_000;
      const expired = hoursAgo > 72;
      const isOnline = onlineUserIds.has(otherId);

      return { match, otherId, profile, profileImageUrl, lastMessage, unread, expired, lastActivityTime, isOnline };
    })
    .filter((c) => !blockedUserIds.includes(c.otherId));

  const filtered = query.trim()
    ? conversations.filter((c) =>
        c.profile?.full_name.toLowerCase().includes(query.toLowerCase())
      )
    : conversations;

  const active = filtered.filter((c) => !c.expired);
  const expired = filtered.filter((c) => c.expired);
  const noMatches = snapshot.matches.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        title="Chats"
        right={{ type: "search", onSearch: setQuery, placeholder: "Search conversations…" }}
      />

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {noMatches ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageCircle size={28} className="text-muted-foreground" />
            </div>
            <p className="font-semibold">{t("messagesEmpty")}</p>
            <p className="text-sm text-muted-foreground">{t("messagesEmptyDesc")}</p>
          </div>
        ) : (
          <div className="pt-2">
            {active.length > 0 && (
              <section>
                <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Active
                </p>
                <div className="divide-y divide-border/50">
                  {active.map(({ match, profile, profileImageUrl, lastMessage, unread, lastActivityTime, isOnline }) =>
                    profile ? (
                      <ConversationRow
                        key={match.id}
                        matchId={match.id}
                        profile={profile}
                        profileImageUrl={profileImageUrl}
                        lastMessage={lastMessage?.content ?? t("messagesSayHello")}
                        lastTime={timeLabel(lastActivityTime)}
                        unread={unread}
                        expired={false}
                        isOnline={isOnline}
                      />
                    ) : null
                  )}
                </div>
              </section>
            )}

            {expired.length > 0 && (
              <section className="mt-2">
                <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Expired
                </p>
                <div className="divide-y divide-border/50">
                  {expired.map(({ match, profile, profileImageUrl, lastMessage, lastActivityTime }) =>
                    profile ? (
                      <ConversationRow
                        key={match.id}
                        matchId={match.id}
                        profile={profile}
                        profileImageUrl={profileImageUrl}
                        lastMessage={lastMessage?.content ?? t("messagesSayHello")}
                        lastTime={timeLabel(lastActivityTime)}
                        unread={0}
                        expired
                        isOnline={false}
                      />
                    ) : null
                  )}
                </div>
              </section>
            )}

            {filtered.length === 0 && !noMatches && (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No conversations found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
