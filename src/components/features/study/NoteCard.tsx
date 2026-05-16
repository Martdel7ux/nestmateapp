import { Globe, Lock, Trash2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CourseBadge } from "./CourseBadge";
import type { Note, NoteVisibility } from "@/types/study";

const visibilityConfig: Record<
  NoteVisibility,
  { label: string; Icon: typeof Lock; color: string }
> = {
  private: { label: "Private", Icon: Lock, color: "text-amber-600 dark:text-amber-400" },
  group: { label: "Group", Icon: Users, color: "text-blue-600 dark:text-blue-400" },
  public: { label: "Public", Icon: Globe, color: "text-emerald-600 dark:text-emerald-400" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  note: Note;
  onClick?: () => void;
  onDelete?: () => void;
}

export function NoteCard({ note, onClick, onDelete }: Props) {
  const navigate = useNavigate();
  const { label, Icon, color } = visibilityConfig[note.visibility];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/study/notes/${note.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer rounded-2xl bg-card border border-border/60 shadow-sm p-4 active:scale-[0.99] transition-transform"
    >
      {/* Header row */}
      <div className="flex items-start gap-2 justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{note.title}</h3>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete note"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Course badge */}
      {note.course && (
        <div className="mt-2">
          <CourseBadge course={note.course} />
        </div>
      )}

      {/* Visibility + metadata row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className={cn("flex items-center gap-1 font-medium", color)}>
          <Icon size={11} />
          {label}
        </span>
        <span>
          {note.upvote_count > 0 && `${note.upvote_count} upvote${note.upvote_count !== 1 ? "s" : ""} · `}
          {formatDate(note.updated_at ?? note.created_at)}
        </span>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
