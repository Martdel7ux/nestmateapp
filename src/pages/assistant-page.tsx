import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";

export function AssistantPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title="NestMate AI"
        subtitle="Cyprus student accommodation expert"
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
        <AssistantChat />
      </div>
    </div>
  );
}
