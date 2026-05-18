import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { TicketThread } from "@/features/help/components/TicketThread";
import {
  fetchTicketWithReplies, replyToTicket, markRepliesRead,
} from "@/features/help/api/help-api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
  closed: "Closed", spam: "Spam",
};

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const { user }     = useAuth();
  const qc           = useQueryClient();
  const [reply, setReply]  = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["help", "ticket", id],
    queryFn:  () => fetchTicketWithReplies(id),
    staleTime: 30 * 1000,
  });

  // Mark unread admin replies as read
  useEffect(() => {
    if (!ticket?.replies?.length || !user) return;
    const unread = ticket.replies
      .filter((r) => r.sender_type === "admin" && !r.read_by_recipient_at)
      .map((r) => r.id);
    if (unread.length) markRepliesRead(unread).catch(() => undefined);
  }, [ticket?.replies, user]);

  // Realtime subscription for new replies
  useEffect(() => {
    if (!supabase || !id) return;
    const sb = supabase;
    const channel = sb
      .channel(`ticket-replies-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_message_replies", filter: `message_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["help", "ticket", id] }),
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [id, qc]);

  // Scroll to bottom on new replies
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies?.length]);

  async function send() {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      await replyToTicket(id, reply.trim());
      setReply("");
      await qc.invalidateQueries({ queryKey: ["help", "ticket", id] });
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  const canReply = ticket && !["resolved", "closed", "spam"].includes(ticket.status);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={ticket?.subject ?? "Ticket"}
        universalSearch={false}
      />

      {isLoading && (
        <div className="flex flex-1 justify-center py-20">
          <Loader2 size={22} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {ticket && (
        <>
          {/* Status bar */}
          <div className="flex items-center gap-2 border-b border-border px-5 py-2">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              ticket.status === "open"        && "bg-amber-500/10 text-amber-600",
              ticket.status === "in_progress" && "bg-blue-500/10 text-blue-600",
              ticket.status === "resolved"    && "bg-emerald-500/10 text-emerald-600",
              ["closed","spam"].includes(ticket.status) && "bg-muted text-muted-foreground",
            )}>
              {STATUS_LABEL[ticket.status]}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(ticket.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Original message */}
          <div className="border-b border-border bg-muted/30 px-5 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Your original message</p>
            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">{ticket.body}</p>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <TicketThread
              replies={ticket.replies ?? []}
              currentUserId={user?.id ?? ""}
            />
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          {canReply && (
            <div className="border-t border-border px-4 py-3 pb-safe">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  rows={2}
                  className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
                  }}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!reply.trim() || sending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">⌘↵ to send</p>
            </div>
          )}

          {!canReply && (
            <div className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground">
              This ticket is {STATUS_LABEL[ticket.status].toLowerCase()} — no further replies.
            </div>
          )}
        </>
      )}
    </div>
  );
}
