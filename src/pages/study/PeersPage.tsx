import { useState } from "react";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PeerCard } from "@/components/features/study/PeerCard";
import { MentorRequestModal } from "@/components/features/study/MentorRequestModal";
import { CourseSelect } from "@/components/features/study/CourseSelect";
import { usePeers } from "@/hooks/use-peers";
import { useCourses } from "@/hooks/use-user-courses";
import { fetchOrCreateDirectConversation } from "@/lib/study-api";
import { useAuth } from "@/contexts/auth-context";

export function PeersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [mentorsOnly, setMentorsOnly] = useState(false);
  const [mentorModal, setMentorModal] = useState<{
    mentorId: string;
    courseId: string;
    courseName: string;
  } | null>(null);

  const { data: peers = [], isLoading } = usePeers(courseId);
  const { data: courses = [] } = useCourses();

  const filteredPeers = mentorsOnly ? peers.filter((p) => p.is_mentor) : peers;

  const handleMessage = async (peerId: string) => {
    if (!user) return;
    try {
      const convo = await fetchOrCreateDirectConversation(user.id, peerId);
      navigate(`/study/messages/${convo.id}?type=direct`);
    } catch {
      toast.error("Failed to open conversation");
    }
  };

  const handleRequestMentor = (peer: typeof peers[0]) => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    setMentorModal({
      mentorId: peer.user_id,
      courseId,
      courseName: course?.title ?? "this course",
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filters */}
      <div className="shrink-0 pt-4 pb-3 px-4 bg-background space-y-3">
        <CourseSelect
          value={courseId}
          onChange={setCourseId}
          placeholder="Select a course to find peers…"
        />

        {courseId && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mentorsOnly}
              onChange={(e) => setMentorsOnly(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm font-medium text-foreground">Mentors only</span>
          </label>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-32 pt-2">
          {!courseId ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <Users size={40} className="text-muted-foreground/40" />
              <p className="font-semibold text-foreground">Select a course</p>
              <p className="text-sm text-muted-foreground">
                Choose a course above to find your study peers
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : filteredPeers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <Users size={40} className="text-muted-foreground/40" />
              <p className="font-semibold text-foreground">No peers found</p>
              <p className="text-sm text-muted-foreground">
                {mentorsOnly
                  ? "No mentors for this course yet"
                  : "Be the first to add this course!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPeers.map((peer) => (
                <PeerCard
                  key={peer.user_id}
                  peer={peer}
                  onMessage={() => void handleMessage(peer.user_id)}
                  onRequestMentor={
                    peer.is_mentor ? () => handleRequestMentor(peer) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mentor request modal */}
      {mentorModal && (
        <MentorRequestModal
          open
          onClose={() => setMentorModal(null)}
          mentorId={mentorModal.mentorId}
          courseId={mentorModal.courseId}
          courseName={mentorModal.courseName}
        />
      )}
    </div>
  );
}
