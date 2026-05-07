import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";

export function AssistantPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-95"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">NestMate AI</h1>
          <p className="text-xs text-muted-foreground">Cyprus student accommodation expert</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <AssistantChat />
      </div>
    </div>
  );
}
