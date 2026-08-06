import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "@/contexts/data-context";
import { IconArrowLeft, IconSend } from "../icons";
import { initialsOf } from "../util";

const AVATAR_COLORS = ["var(--nm-accent)", "var(--nm-mint)", "var(--nm-coral)"];
const AVATAR_FG = ["#fff", "#08281f", "#41120e"];

function shortTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days < 7) return `${Math.floor(days)}d`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Thread {
  matchId: string;
  otherId: string;
  name: string;
  avatar: string | null;
  last: string;
  time: string;
  unread: number;
  activity: number;
}

function ChatView({ matchId, thread, onBack }: { matchId: string; thread: Thread; onBack: () => void }) {
  const { snapshot, sendMessage, markMessagesRead } = useData();
  const myId = snapshot.profile.id;
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const msgs = useMemo(
    () => snapshot.messages.filter((m) => m.match_id === matchId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [snapshot.messages, matchId],
  );

  useEffect(() => { markMessagesRead(matchId); }, [matchId, msgs.length, markMessagesRead]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(matchId, text);
    setDraft("");
  };

  return (
    <div style={{ animation: "nmFade .3s ease-out", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ flex: "none", padding: "calc(14px + env(safe-area-inset-top)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "var(--nm-surface)", borderBottom: "1px solid var(--nm-line)" }}>
        <button type="button" onClick={onBack} aria-label="Back to messages" className="nm-icon-btn nm-press" style={{ width: 36, height: 36, flex: "none" }}>
          <IconArrowLeft size={18} />
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 99, overflow: "hidden", background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px var(--nm-font-text)" }}>
          {thread.avatar ? <img src={thread.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(thread.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{thread.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--nm-mint)" }}>Student · matched</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 16px 8px", display: "flex", flexDirection: "column", gap: 10, justifyContent: "flex-end" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--nm-muted)", fontSize: 13, padding: "20px 0" }}>Say hello 👋</div>
        )}
        {msgs.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%", padding: "12px 15px", fontSize: 14.5, lineHeight: 1.45, borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px", background: mine ? "var(--nm-accent)" : "var(--nm-surface)", color: mine ? "#fff" : "var(--nm-text)", boxShadow: mine ? "none" : "var(--nm-elev)" }}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div style={{ flex: "none", padding: "12px 16px calc(14px + env(safe-area-inset-bottom))", display: "flex", gap: 10, alignItems: "center", borderTop: "1px solid var(--nm-line)", background: "var(--nm-surface)" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Message"
          style={{ flex: 1, padding: "12px 15px", borderRadius: 99, border: "none", outline: "none", background: "var(--nm-surface2)", fontSize: 16, color: "var(--nm-text)" }}
        />
        <button type="button" onClick={send} aria-label="Send" style={{ all: "unset", cursor: "pointer", width: 42, height: 42, borderRadius: 99, background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconSend size={18} />
        </button>
      </div>
    </div>
  );
}

export function MessagesScreen({ onChatOpenChange }: { onChatOpenChange?: (open: boolean) => void }) {
  const { snapshot } = useData();
  const [openMatch, setOpenMatch] = useState<string | null>(null);
  const myId = snapshot.profile.id;

  // Tell the shell to hide the bottom nav while a conversation is open.
  useEffect(() => {
    onChatOpenChange?.(!!openMatch);
  }, [openMatch, onChatOpenChange]);
  useEffect(() => () => onChatOpenChange?.(false), [onChatOpenChange]);

  const threads: Thread[] = useMemo(() => {
    return snapshot.matches
      .map((match) => {
        const otherId = match.user_a === myId ? match.user_b : match.user_a;
        const listing = snapshot.flatmates.find((f) => f.user_id === otherId);
        const msgs = snapshot.messages.filter((m) => m.match_id === match.id);
        const last = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => !m.read && m.sender_id !== myId).length;
        const activity = new Date(last?.created_at ?? match.created_at).getTime();
        return {
          matchId: match.id,
          otherId,
          name: listing?.profile?.full_name ?? "Roommate",
          avatar: listing?.profile_image_url ?? listing?.profile?.avatar_url ?? null,
          last: last?.content ?? "You matched — say hello!",
          time: shortTime(last?.created_at ?? match.created_at),
          unread,
          activity,
        };
      })
      .sort((a, b) => b.activity - a.activity);
  }, [snapshot.matches, snapshot.messages, snapshot.flatmates, myId]);

  if (openMatch) {
    const thread = threads.find((t) => t.matchId === openMatch);
    if (thread) return <ChatView matchId={openMatch} thread={thread} onBack={() => setOpenMatch(null)} />;
  }

  return (
    <div style={{ padding: "calc(20px + env(safe-area-inset-top)) 0 20px", animation: "nmFade .35s ease-out" }}>
      <div style={{ padding: "0 20px", fontFamily: "var(--nm-font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-.03em" }}>Messages</div>

      {threads.length === 0 ? (
        <div style={{ padding: "0 20px" }}>
          <div className="nm-card nm-card-lg" style={{ marginTop: 20, padding: 26, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <span className="nm-pill">No conversations yet</span>
            <p style={{ fontSize: 13.5, color: "var(--nm-muted)", lineHeight: 1.5, maxWidth: 260 }}>Match with roommates in Explore to start chatting.</p>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {threads.map((c, i) => (
            <button key={c.matchId} type="button" onClick={() => setOpenMatch(c.matchId)} className="nm-press" style={{ all: "unset", cursor: "pointer", display: "flex", width: "100%", boxSizing: "border-box", gap: 13, alignItems: "center", padding: "14px 20px" }}>
              <span style={{ width: 46, height: 46, flex: "none", borderRadius: 99, overflow: "hidden", background: AVATAR_COLORS[i % 3], color: AVATAR_FG[i % 3], display: "flex", alignItems: "center", justifyContent: "center", font: "600 15px var(--nm-font-text)" }}>
                {c.avatar ? <img src={c.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(c.name)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--nm-muted)", whiteSpace: "nowrap" }}>{c.time}</span>
                </span>
                <span style={{ display: "block", fontSize: 13, color: "var(--nm-muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.last}</span>
              </span>
              {c.unread > 0 && <span style={{ width: 8, height: 8, flex: "none", borderRadius: 99, background: "var(--nm-accent)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
