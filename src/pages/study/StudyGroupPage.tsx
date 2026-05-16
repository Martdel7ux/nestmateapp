import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GroupMembersList } from "@/components/features/study/GroupMembersList";
import { NoteCard } from "@/components/features/study/NoteCard";
import { MessageBubble } from "@/components/features/study/MessageBubble";
import { MessageInput } from "@/components/features/study/MessageInput";
import { CourseBadge } from "@/components/features/study/CourseBadge";
import { useStudyGroup, useGroupNotes } from "@/hooks/use-study-group";
import { useJoinStudyGroup, useLeaveStudyGroup } from "@/hooks/use-study-groups";
import { useMessages, useSendMessage } from "@/hooks/use-messages";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useRef } from "react";

type GroupTab = "notes" | "members" | "chat";

export function StudyGroupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<GroupTab>("notes");

  const { data: group, isLoading } = useStudyGroup(id ?? "");
  const { data: groupNotes = [] } = useGroupNotes(id ?? "");
  const { data: messages = [] } = useMessages(id ?? "", "group");
  const { mutate: sendMsg } = useSendMessage(id ?? "", "group");
  const { mutate: joinGroup, isPending: joining } = useJoinStudyGroup();
  const { mutate: leaveGroup, isPending: leaving } = useLeaveStudyGroup();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const isMember = !!group?.member_role;
  const isOwnerOrAdmin =
    group?.member_role === "owner" || group?.member_role === "admin";

  const handleJoin = () => {
    if (!id) return;
    joinGroup(id, {
      onSuccess: () => toast.success("Joined group!"),
      onError: () => toast.error("Failed to join group"),
    });
  };

  const handleLeave = () => {
    if (!id || !confirm("Leave this group?")) return;
    leaveGroup(id, {
      onSuccess: () => {
        toast.success("Left group");
        navigate("/study/groups");
      },
      onError: () => toast.error("Failed to leave group"),
    });
  };

  const handleSendMessage = (content: string, attachmentUrl?: string) => {
    sendMsg(
      { content, attachment_url: attachmentUrl },
      { onError: () => toast.error("Failed to send message") }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-14 bg-background border-b border-border" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-3/4 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const TABS: { value: GroupTab; label: string }[] = [
    { value: "notes", label: "Notes" },
    { value: "members", label: "Members" },
    { value: "chat", label: "Chat" },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-primary/10 dark:bg-primary/5 px-4 pb-3 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate">{group.name}</h1>
            {group.course && <CourseBadge course={group.course} className="mt-0.5" />}
          </div>

          {/* Join/Leave */}
          {isMember ? (
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaving}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Leave
            </button>
          ) : (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Join
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-semibold transition-all",
                activeTab === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden rounded-t-3xl bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* Notes tab */}
        {activeTab === "notes" && (
          <div className="flex h-full flex-col">
            {isMember && (
              <div className="shrink-0 flex justify-end px-4 pt-3">
                <button
                  type="button"
                  onClick={() => navigate("/study/notes/new")}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Plus size={12} />
                  Add note to group
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pb-32 pt-3 space-y-3">
                {groupNotes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <p className="text-sm text-muted-foreground">No notes shared yet</p>
                  </div>
                ) : (
                  groupNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members tab */}
        {activeTab === "members" && (
          <div className="flex-1 overflow-y-auto">
            {group && <GroupMembersList groupId={group.id} />}
          </div>
        )}

        {/* Chat tab */}
        {activeTab === "chat" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-4 space-y-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === user?.id}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            {isMember ? (
              <MessageInput onSend={handleSendMessage} />
            ) : (
              <div className="shrink-0 border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
                Join this group to send messages
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
