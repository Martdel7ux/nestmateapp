import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/auth-context";
import { IconSend } from "../icons";

interface Msg { role: "user" | "assistant"; content: string; }

const INTRO: Msg = {
  role: "assistant",
  content: "## Hi, I'm NestMate AI 👋\n\nAsk me about your **rent**, **documents** or **flatmates**, or anything about student life in Cyprus — visas, contracts, neighbourhoods, cost of living.\n\nWhat can I help with?",
};

const SUGGESTIONS = [
  "When is my rent due?",
  "Do I have any documents expiring soon?",
  "How do I split bills with my flatmates?",
  "What's the average student rent in Nicosia?",
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function AssistantBody() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([INTRO]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const setLastAssistant = (content: string) =>
    setMessages((cur) => cur.map((m, i) => (i === cur.length - 1 ? { ...m, content } : m)));

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || streaming) return;
    const history = [...messages, { role: "user", content: q } as Msg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setStreaming(true);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setLastAssistant("The assistant isn't configured right now."); setStreaming(false); return;
    }

    // Drop the opening intro so the model sees a clean conversation.
    const apiMessages = history.filter((m, i) => !(i === 0 && m.role === "assistant"));

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (res.status === 429) { setLastAssistant("You're sending messages a little fast — give it a moment and try again."); setStreaming(false); return; }
      if (!res.ok || !res.body) throw new Error("bad response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") { setStreaming(false); return; }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.delta ?? parsed.choices?.[0]?.delta?.content ?? "";
            if (delta) { acc += delta; setLastAssistant(acc); }
          } catch { /* ignore malformed line */ }
        }
      }
      setStreaming(false);
    } catch {
      setLastAssistant("Sorry — I couldn't reach the assistant just now. Please try again in a moment.");
      setStreaming(false);
    }
  };

  const isIntroOnly = messages.length === 1;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* Scrollable conversation */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => {
            const mine = m.role === "user";
            const empty = !m.content && streaming && i === messages.length - 1;
            return (
              <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: mine ? "82%" : "100%", padding: mine ? "11px 15px" : "13px 15px", borderRadius: mine ? "20px 20px 6px 20px" : "6px 20px 20px 20px", background: mine ? "var(--nm-accent)" : "var(--nm-surface)", color: mine ? "#fff" : "var(--nm-text)", boxShadow: mine ? "none" : "var(--nm-elev)", fontSize: 14.5, lineHeight: 1.5 }}>
                  {mine
                    ? m.content
                    : <div className="nm-md"><ReactMarkdown>{empty ? "▌" : m.content}</ReactMarkdown></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggested prompts */}
        {isIntroOnly && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)} className="nm-press" style={{ all: "unset", cursor: "pointer", padding: "12px 15px", borderRadius: "var(--nm-r-md)", background: "var(--nm-soft)", color: "var(--nm-accent)", font: "500 13.5px var(--nm-font-text)" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        <p style={{ marginTop: 16, fontSize: 10.5, color: "var(--nm-muted)", lineHeight: 1.5 }}>
          NestMate AI can be inaccurate. Verify anything important with your university's office or the relevant authorities.
        </p>

        <div ref={bottomRef} />
      </div>

      {/* Composer — fixed at the bottom */}
      <div style={{ flex: "none", paddingTop: 8, paddingBottom: "calc(10px + env(safe-area-inset-bottom))", display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(draft); }}
          placeholder="Ask NestMate AI…"
          disabled={streaming}
          style={{ flex: 1, padding: "13px 16px", borderRadius: 99, border: "1px solid var(--nm-line)", outline: "none", background: "var(--nm-surface)", fontSize: 16, color: "var(--nm-text)", boxShadow: "var(--nm-elev)" }}
        />
        <button type="button" onClick={() => send(draft)} disabled={!draft.trim() || streaming} aria-label="Send" className="nm-press" style={{ all: "unset", cursor: draft.trim() && !streaming ? "pointer" : "not-allowed", width: 46, height: 46, flex: "none", borderRadius: 99, background: "var(--nm-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: draft.trim() && !streaming ? 1 : 0.5 }}>
          <IconSend size={19} />
        </button>
      </div>
    </div>
  );
}
