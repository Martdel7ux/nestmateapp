import { useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { CourseBadge } from "@/components/features/study/CourseBadge";
import { UpvoteButton } from "@/components/features/study/UpvoteButton";
import { MentorBadge } from "@/components/features/study/MentorBadge";
import { MentorRequestModal } from "@/components/features/study/MentorRequestModal";
import { Avatar } from "@/components/ui/avatar";
import { useNote } from "@/hooks/use-note";
import { useAuth } from "@/contexts/auth-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PublicNotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: note, isLoading } = useNote(id ?? "");
  const [mentorModalOpen, setMentorModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-14 bg-background border-b border-border" />
        <div className="p-5 space-y-3">
          <div className="h-7 w-3/4 bg-muted animate-pulse rounded-xl" />
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-semibold">Note not found</p>
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-primary">
          Go back
        </button>
      </div>
    );
  }

  const owner = note.owner;
  const isOwner = user?.id === note.owner_id;
  // Determine if author is a mentor (approximation — full check via peer profile)
  const authorIsMentor = false; // Placeholder — real apps would check user_courses.is_mentor

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-sm font-semibold text-foreground truncate">{note.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 pb-32">
          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground leading-tight">{note.title}</h1>

          {/* Course badge */}
          {note.course && (
            <div className="mt-2">
              <CourseBadge course={note.course} />
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDate(note.updated_at ?? note.created_at)}
            {note.view_count > 0 && ` · ${note.view_count} views`}
          </p>

          {/* Upvote */}
          <div className="mt-4">
            <UpvoteButton
              noteId={note.id}
              count={note.upvote_count}
              isUpvoted={note.is_upvoted ?? false}
              disabled={!user || isOwner}
            />
          </div>

          {/* Content */}
          <div className="mt-5 prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            <ReactMarkdown>{note.content ?? ""}</ReactMarkdown>
          </div>

          {/* Attachments */}
          {note.attachment_urls && note.attachment_urls.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Attachments</h3>
              <div className="space-y-2">
                {note.attachment_urls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm text-primary hover:bg-muted/80"
                  >
                    <Download size={14} />
                    Attachment {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Author card */}
          {owner && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Author
              </p>
              <div className="flex items-center gap-3">
                <Avatar
                  name={owner.full_name}
                  src={owner.avatar_url}
                  className="h-12 w-12 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{owner.full_name}</span>
                    {authorIsMentor && <MentorBadge />}
                  </div>
                  {owner.university && (
                    <p className="text-xs text-muted-foreground">{owner.university}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/study/peers/${owner.id}`)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  View profile
                </button>
                {authorIsMentor && note.course_id && (
                  <button
                    type="button"
                    onClick={() => setMentorModalOpen(true)}
                    className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Request mentor
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mentor request modal */}
      {owner && note.course_id && (
        <MentorRequestModal
          open={mentorModalOpen}
          onClose={() => setMentorModalOpen(false)}
          mentorId={owner.id}
          courseId={note.course_id}
          courseName={note.course?.title ?? "this course"}
        />
      )}
    </div>
  );
}
