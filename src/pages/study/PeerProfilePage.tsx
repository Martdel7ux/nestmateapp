import { useState } from "react";
import { Flag } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Avatar } from "@/components/ui/avatar";
import { MentorBadge } from "@/components/features/study/MentorBadge";
import { CourseBadge } from "@/components/features/study/CourseBadge";
import { NoteCard } from "@/components/features/study/NoteCard";
import { MentorRequestModal } from "@/components/features/study/MentorRequestModal";
import { usePeerProfile } from "@/hooks/use-peer-profile";
import { useAuth } from "@/contexts/auth-context";
import { blockStudyUser, fetchOrCreateDirectConversation, reportContent } from "@/lib/study-api";

const STATUS_LABELS: Record<string, string> = {
  currently_taking: "Currently Taking",
  completed: "Completed",
  planning_to_take: "Planning to Take",
};

export function PeerProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: peer, isLoading } = usePeerProfile(userId ?? "");
  const [mentorModal, setMentorModal] = useState<{
    courseId: string;
    courseName: string;
  } | null>(null);

  const handleMessage = async () => {
    if (!user || !userId) return;
    try {
      const convo = await fetchOrCreateDirectConversation(user.id, userId);
      navigate(`/study/messages/${convo.id}?type=direct`);
    } catch {
      toast.error("Failed to open conversation");
    }
  };

  const handleBlock = async () => {
    if (!user || !userId) return;
    if (!confirm("Block this user? They won't be able to contact you.")) return;
    await blockStudyUser(user.id, userId);
    toast.success("User blocked");
    navigate(-1);
  };

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this user?");
    if (!reason?.trim() || !user || !userId) return;
    await reportContent({
      reporter_id: user.id,
      reported_id: userId,
      content_type: "user",
      reason: reason.trim(),
    });
    toast.success("Report submitted");
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-14 bg-background border-b border-border" />
        <div className="p-5 space-y-3">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!peer) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const mentorCourse = peer.user_courses?.find((uc) => uc.is_mentor && uc.course);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={peer.full_name}
        right={{
          type: "custom",
          element: (
            <button
              type="button"
              onClick={handleReport}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
              aria-label="Report user"
            >
              <Flag size={16} />
            </button>
          ),
        }}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 pb-32 space-y-6">
          {/* Profile info */}
          <div className="flex items-start gap-4">
            <Avatar name={peer.full_name} src={peer.avatar_url} className="h-16 w-16 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{peer.full_name}</h2>
                {peer.is_mentor && <MentorBadge />}
              </div>
              {peer.university && (
                <p className="mt-0.5 text-sm text-muted-foreground">{peer.university}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {peer.bio && (
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground">About</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <ReactMarkdown>{peer.bio}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {user?.id !== userId && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleMessage()}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Message
              </button>
              {peer.is_mentor && mentorCourse?.course && (
                <button
                  type="button"
                  onClick={() =>
                    setMentorModal({
                      courseId: mentorCourse.course_id,
                      courseName: mentorCourse.course!.title,
                    })
                  }
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Request mentor
                </button>
              )}
            </div>
          )}

          {/* Courses */}
          {peer.user_courses && peer.user_courses.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Courses</h3>
              <div className="space-y-2">
                {peer.user_courses.map((uc) => (
                  <div
                    key={uc.course_id}
                    className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      {uc.course && <CourseBadge course={uc.course} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABELS[uc.status] ?? uc.status}
                      </span>
                      {uc.is_mentor && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Mentor
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public notes */}
          {peer.public_notes && peer.public_notes.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Public Notes</h3>
              <div className="space-y-3">
                {peer.public_notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Block button */}
          {user?.id !== userId && (
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleBlock}
                className="w-full rounded-xl border border-destructive/40 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Block this user
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mentor modal */}
      {mentorModal && userId && (
        <MentorRequestModal
          open
          onClose={() => setMentorModal(null)}
          mentorId={userId}
          courseId={mentorModal.courseId}
          courseName={mentorModal.courseName}
        />
      )}
    </div>
  );
}
