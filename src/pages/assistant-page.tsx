import { PageHeader } from "@/components/layout/page-header";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";

export function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assistant"
        title="Cyprus student accommodation expert"
        description="Streaming answers, platform guidance, cost-of-living context, and visa-aware rental advice."
      />
      <AssistantChat />
    </div>
  );
}
