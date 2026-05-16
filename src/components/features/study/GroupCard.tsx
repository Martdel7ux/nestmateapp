import { Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseBadge } from "./CourseBadge";
import type { StudyGroup } from "@/types/study";

interface Props {
  group: StudyGroup;
  onClick?: () => void;
}

export function GroupCard({ group, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-card border border-border/60 shadow-sm p-4",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform"
      )}
    >
      {/* Name + badges */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground leading-snug truncate">{group.name}</h3>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            group.is_private
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          )}
        >
          {group.is_private ? (
            <>
              <Lock size={10} /> Private
            </>
          ) : (
            <>
              <Users size={10} /> Public
            </>
          )}
        </span>
      </div>

      {/* Course badge */}
      {group.course && (
        <div className="mt-2">
          <CourseBadge course={group.course} />
        </div>
      )}

      {/* Description */}
      {group.description && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{group.description}</p>
      )}

      {/* Member count */}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Users size={12} />
        <span>
          {group.member_count ?? "—"} / {group.max_members} members
        </span>
      </div>
    </div>
  );
}
