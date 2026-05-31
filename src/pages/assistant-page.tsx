import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, ChevronLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AssistantChat, type AssistantChatRef } from "@/components/features/assistant/assistant-chat";
import { useI18n } from "@/contexts/i18n-context";

export function AssistantPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const chatRef  = useRef<AssistantChatRef>(null);

  const source    = params.get("source");    // "help"
  const prompt    = params.get("prompt");    // pre-fill question
  const fromHelp  = source === "help";

  // Pre-fill the chat input once the component mounts
  useEffect(() => {
    if (prompt && chatRef.current) {
      chatRef.current.setInput(decodeURIComponent(prompt));
    }
  }, [prompt]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* "Coming from Help Center" banner */}
      {fromHelp && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-2">
          <Link
            to="/profile/help"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ChevronLeft size={13} />
            Help Center
          </Link>
          <span className="text-[11px] text-muted-foreground">· Ask me anything</span>
        </div>
      )}

      <AppHeader
        variant="sub-page"
        title="NestMate AI"
        subtitle={t("assistantSubtitle")}
        universalSearch={false}
        right={{
          type: "custom",
          element: (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={18} />
            </div>
          ),
        }}
      />

      <div className="flex-1 overflow-hidden">
        {/* TODO: read article_id param and inject article context into system prompt */}
        <AssistantChat ref={chatRef} initialPrompt={prompt ? decodeURIComponent(prompt) : undefined} />
      </div>
    </div>
  );
}
