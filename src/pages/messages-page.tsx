import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useData } from "@/contexts/data-context";
import { useI18n } from "@/contexts/i18n-context";
import type { Profile } from "@/types/supabase";

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── Story avatar (top strip) ──────────────────────────────────────────────────
function StoryAvatar({ profile, matchId }: { profile: Profile; matchId: string }) {
  return (
    <Link to={`/messages/${matchId}`} className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative">
        <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-transparent">
          <Avatar name={profile.full_name} src={profile.avatar_url} className="h-full w-full" />
        </div>
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      </div>
      <span className="max-w-[60px] truncate text-center text-[11px] font-medium text-foreground/70">
        {profile.full_name.split(" ")[0]}
      </span>
    </Link>
  );
}

// ── Single conversation row ───────────────────────────────────────────────────
function ConversationRow({
  matchId,
  profile,
  lastMessage,
  lastTime,
  unread,
  expired,
}: {
  matchId: string;
  profile: Profile;
  lastMessage: string;
  lastTime: string | null;
  unread: number;
  expired: boolean;
}) {
  return (
    <Link
      to={`/messages/${matchId}`}
      className={`flex items-center gap-3 px-5 py-3 transition active:bg-muted/50 ${expired ? "opacity-50" : ""}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`h-14 w-14 overflow-hidden rounded-full ${expired ? "grayscale" : ""}`}>
          <Avatar name={profile.full_name} src={profile.avatar_url} className="h-full w-full" />
        </div>
        {!expired && (
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

      {/* Right side: time + badge */}
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

// ── Page ─────────────────────────────────────────────────────────────────────
export function MessagesPage() {
  const { snapshot } = useData();
  const { t } = useI18n();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  // Build conversation data for each match
  const conversations = snapshot.matches.map((match) => {
    const otherId =
      match.user_a === snapshot.profile.id ? match.user_b : match.user_a;
    const profile =
      snapshot.flatmates.find((f) => f.user_id === otherId)?.profile ??
      snapshot.flatmates.find((f) => f.user_id === otherId)?.profile;
    const messages = snapshot.messages.filter((m) => m.match_id === match.id);
    const lastMessage = messages[messages.length - 1];
    const unread = messages.filter(
      (m) => !m.read && m.sender_id !== snapshot.profile.id
    ).length;

    const lastActivityTime = lastMessage?.created_at ?? match.created_at;
    const hoursAgo =
      (Date.now() - new Date(lastActivityTime).getTime()) / 3_600_000;
    const expired = hoursAgo > 72; // treat as expired after 72 h of silence

    return { match, otherId, profile, lastMessage, unread, expired, lastActivityTime };
  });

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
      {/* ── Colored header ── */}
      <div className="shrink-0 bg-primary/10 px-5 pb-5 pt-4 dark:bg-primary/5">
        {/* Title row */}
        <div className="flex items-center justify-between">
          {searching ? (
            <div className="flex flex-1 items-center gap-2 rounded-2xl bg-background/70 px-3 py-2 dark:bg-slate-800/70">
              <Search size={15} className="shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => { setSearching(false); setQuery(""); }}
              >
                <X size={15} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-foreground">Chats</h1>
              <button
                type="button"
                onClick={() => setSearching(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 shadow-sm dark:bg-slate-800/60"
              >
                <Search size={18} className="text-foreground" />
              </button>
            </>
          )}
        </div>

        {/* Story avatars strip */}
        {!noMatches && (
          <div className="mt-4 flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
            {conversations.filter((c) => !c.expired && c.profile).map(({ match, profile }) => (
              <StoryAvatar key={match.id} profile={profile!} matchId={match.id} />
            ))}
          </div>
        )}
      </div>

      {/* ── Conversations ── */}
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
            {/* Active section */}
            {active.length > 0 && (
              <section>
                <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Active
                </p>
                <div className="divide-y divide-border/50">
                  {active.map(({ match, profile, lastMessage, unread, lastActivityTime }) =>
                    profile ? (
                      <ConversationRow
                        key={match.id}
                        matchId={match.id}
                        profile={profile}
                        lastMessage={lastMessage?.content ?? t("messagesSayHello")}
                        lastTime={timeLabel(lastActivityTime)}
                        unread={unread}
                        expired={false}
                      />
                    ) : null
                  )}
                </div>
              </section>
            )}

            {/* Expired section */}
            {expired.length > 0 && (
              <section className="mt-2">
                <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Expired
                </p>
                <div className="divide-y divide-border/50">
                  {expired.map(({ match, profile, lastMessage, lastActivityTime }) =>
                    profile ? (
                      <ConversationRow
                        key={match.id}
                        matchId={match.id}
                        profile={profile}
                        lastMessage={lastMessage?.content ?? t("messagesSayHello")}
                        lastTime={timeLabel(lastActivityTime)}
                        unread={0}
                        expired
                      />
                    ) : null
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
