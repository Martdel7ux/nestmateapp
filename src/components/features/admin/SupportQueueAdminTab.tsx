import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchAllSupportMessages, fetchTicketWithReplies,
  updateTicketStatus, adminReplyToTicket,
} from "@/features/help/api/help-api";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/types/help";

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-amber-500/10 text-amber-600",
  in_progress: "bg-blue-500/10  text-blue-600",
  resolved:    "bg-emerald-500/10 text-emerald-600",
  closed:      "bg-muted text-muted-foreground",
  spam:        "bg-muted text-muted-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-muted text-muted-foreground",
  normal: "bg-muted text-muted-foreground",
  high:   "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

export function SupportQueueAdminTab() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin", "support-queue"],
    queryFn:  fetchAllSupportMessages,
    refetchInterval: 30 * 1000,
  });

  const { data: ticket } = useQuery({
    queryKey: ["admin", "ticket", selected],
    queryFn:  () => fetchTicketWithReplies(selected!),
    enabled:  Boolean(selected),
    staleTime: 15 * 1000,
  });

  // Realtime on new messages + replies
  useEffect(() => {
    if (!supabase) return;
    const sb = supabase;
    const ch = sb
      .channel("admin-support-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => {
        qc.invalidateQueries({ queryKey: ["admin", "support-queue"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_message_replies" }, () => {
        if (selected) qc.invalidateQueries({ queryKey: ["admin", "ticket", selected] });
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [selected, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies?.length]);

  async function sendReply() {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      await adminReplyToTicket(selected, reply.trim());
      setReply("");
      await qc.invalidateQueries({ queryKey: ["admin", "ticket", selected] });
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    await updateTicketStatus(selected, status);
    await qc.invalidateQueries({ queryKey: ["admin", "support-queue"] });
    await qc.invalidateQueries({ queryKey: ["admin", "ticket", selected] });
  }

  return (
    <div className="flex h-[70vh] gap-4 overflow-hidden">
      {/* Queue list */}
      <div className="w-80 shrink-0 overflow-y-auto rounded-2xl border border-border">
        {isLoading && (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
        )}
        {tickets.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className={cn(
              "w-full text-left border-b border-border px-4 py-3 transition hover:bg-muted/40",
              selected === t.id && "bg-muted/60",
            )}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className={`text-[10px] py-0 px-1.5 ${STATUS_STYLES[t.status]}`}>{t.status}</Badge>
              <Badge className={`text-[10px] py-0 px-1.5 ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</Badge>
            </div>
            <p className="truncate text-sm font-semibold">{t.subject || "Support request"}</p>
            <p className="truncate text-xs text-muted-foreground">{t.user_email}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(t.created_at).toLocaleDateString()}
            </p>
          </button>
        ))}
        {!isLoading && tickets.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No tickets yet.</p>
        )}
      </div>

      {/* Ticket detail */}
      {ticket ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="font-semibold text-sm">{ticket.subject || "Support request"}</p>
              <p className="text-xs text-muted-foreground">{ticket.user_email} · {new Date(ticket.created_at).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {["open","in_progress","resolved","closed","spam"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={ticket.status === s ? "default" : "outline"}
                  onClick={() => changeStatus(s)}
                  className="text-[11px] capitalize px-2 py-1 h-auto"
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Original message */}
          <div className="border-b border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Original message</p>
            <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
          </div>

          {/* Thread */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {(ticket.replies ?? []).map((r) => (
              <div key={r.id} className={cn("flex", r.sender_type === "admin" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
                  r.sender_type === "admin"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted border border-border rounded-bl-sm",
                )}>
                  <p className="text-[10px] font-semibold opacity-60 mb-1">
                    {r.sender_type === "admin" ? "You (admin)" : "User"}
                  </p>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">
                    {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/70 px-3 py-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                rows={2}
                className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply(); }}
              />
              <button
                type="button"
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 transition"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-border text-sm text-muted-foreground">
          Select a ticket to view
        </div>
      )}
    </div>
  );
}
