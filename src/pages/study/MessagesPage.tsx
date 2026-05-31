import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationListItemRow } from "@/components/features/study/ConversationListItem";
import { useConversations } from "@/hooks/use-conversations";
import type { StudyMessageConvType } from "@/types/study";
import { useI18n } from "@/contexts/i18n-context";

export function StudyMessagesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();

  const handleConvoClick = (id: string, type: StudyMessageConvType) => {
    navigate(`/study/messages/${id}?type=${type}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader variant="sub-page" title={t("studyMessages")} right={{ type: "none" }} />

      {/* List */}
      <div className="flex-1 overflow-y-auto rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {isLoading ? (
          <div className="space-y-px pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-2.5 w-40 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center px-8">
            <MessageCircle size={40} className="text-muted-foreground/40" />
            <p className="font-semibold text-foreground">{t("studyNoConversations")}</p>
            <p className="text-sm text-muted-foreground">
              {t("studyStartChatting")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border pt-2">
            {conversations.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="w-full text-left"
                onClick={() => handleConvoClick(item.id, item.type)}
              >
                <ConversationListItemRow item={item} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
