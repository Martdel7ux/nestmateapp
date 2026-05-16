import { Download, Edit2 } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { CourseBadge } from "@/components/features/study/CourseBadge";
import { UpvoteButton } from "@/components/features/study/UpvoteButton";
import { useNote } from "@/hooks/use-note";
import { useAuth } from "@/contexts/auth-context";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NoteViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: note, isLoading } = useNote(id ?? "");

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="h-14 bg-background border-b border-border" />
        <div className="p-5 space-y-3">
          <Skeleton className="h-7 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-xl" />
          <Skeleton className="h-40 rounded-2xl" />
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

  const isOwner = user?.id === note.owner_id;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppHeader
        variant="sub-page"
        title={note.title}
        right={
          isOwner
            ? {
                type: "custom",
                element: (
                  <button
                    type="button"
                    onClick={() => navigate(`/study/notes/${note.id}/edit`)}
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Edit note"
                  >
                    <Edit2 size={17} />
                  </button>
                ),
              }
            : { type: "none" }
        }
      />

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

          {/* Upvote (only for public notes) */}
          {note.visibility === "public" && (
            <div className="mt-4">
              <UpvoteButton
                noteId={note.id}
                count={note.upvote_count}
                isUpvoted={note.is_upvoted ?? false}
                disabled={!user || isOwner}
              />
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
