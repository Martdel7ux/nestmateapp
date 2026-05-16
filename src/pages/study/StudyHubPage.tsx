import { useState } from "react";
import { BookOpen, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MyNotesPage } from "./MyNotesPage";
import { PublicLibraryPage } from "./PublicLibraryPage";
import { StudyGroupsPage } from "./StudyGroupsPage";
import { PeersPage } from "./PeersPage";

type Tab = "notes" | "library" | "groups" | "peers";

const TABS: { value: Tab; label: string }[] = [
  { value: "notes", label: "My Notes" },
  { value: "library", label: "Library" },
  { value: "groups", label: "Groups" },
  { value: "peers", label: "Peers" },
];

export function StudyHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("notes");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 px-5 pb-4 pt-4 dark:bg-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Study Hub</h1>
          </div>
          <Link
            to="/study/messages"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Messages"
          >
            <MessageCircle size={18} />
          </Link>
        </div>

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
                  : "bg-background/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
