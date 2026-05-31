import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";
import { useScrolled } from "@/hooks/use-scrolled";
import { MyNotesPage } from "./MyNotesPage";
import { PublicLibraryPage } from "./PublicLibraryPage";
import { StudyGroupsPage } from "./StudyGroupsPage";
import { PeersPage } from "./PeersPage";
import { useI18n } from "@/contexts/i18n-context";

type Tab = "notes" | "library" | "groups" | "peers";

export function StudyHubPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const isCollapsed = useScrolled(50);

  const TABS: { value: Tab; label: string }[] = [
    { value: "notes", label: t("studyMyNotes") },
    { value: "library", label: t("studyLibrary") },
    { value: "groups", label: t("studyGroups") },
    { value: "peers", label: t("studyPeers") },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        title={t("studyHubTitle")}
        universalSearch={!isCollapsed}
        right={{
          type: "custom",
          element: (
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Link
                    to="/study/messages"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-fill)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm text-foreground hover:brightness-110 transition-colors"
                    aria-label="Study messages"
                  >
                    <MessageCircle size={18} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          ),
        }}
      >
        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                activeTab === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-[var(--glass-fill)] border border-[var(--glass-border)] [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)] text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </AppHeader>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {activeTab === "notes" && <MyNotesPage />}
        {activeTab === "library" && <PublicLibraryPage />}
        {activeTab === "groups" && <StudyGroupsPage />}
        {activeTab === "peers" && <PeersPage />}
      </div>
    </div>
  );
}
