import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starter: Message[] = [
  {
    role: "assistant",
    content:
      "## Cyprus housing help\nAsk about rent ranges, neighborhoods, visas, NestMate features, or how to match with the right flatmate."
  }
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>(starter);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim()) return;
    const question = draft.trim();
    setMessages((current) => [...current, { role: "user", content: question }]);
    setDraft("");

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            `### NestMate recommendation\nFor **${question}**, I’d start with NestMate’s smart property filters, verified landlord badges, and flatmate matching. In Cyprus, students usually compare proximity to campus, bus links, and whether utilities are bundled into the rent.`
        }
      ]);
    }, 450);
  };

  return (
    <Card className="space-y-5 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="font-semibold">NestMate AI assistant</p>
          <p className="text-sm text-muted-foreground">
            Streaming-ready UI backed by the Supabase Edge Function in this repo.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.75rem] bg-muted/40 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={message.role === "assistant" ? "mr-auto" : "ml-auto"}
          >
            <div
              className={[
                "max-w-[min(100%,42rem)] rounded-[1.5rem] px-4 py-3 text-sm",
                message.role === "assistant"
                  ? "bg-card text-card-foreground"
                  : "bg-primary text-primary-foreground"
              ].join(" ")}
            >
              <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about rent, neighborhoods, visas, or NestMate features..."
        />
        <Button onClick={handleSend}>
          <SendHorizontal size={16} />
          Ask
        </Button>
      </div>
    </Card>
  );
}
