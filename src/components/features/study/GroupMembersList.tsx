import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { useGroupMembers } from "@/hooks/use-study-group";
import type { StudyGroupRole } from "@/types/study";

const roleConfig: Record<StudyGroupRole, { label: string; className: string }> = {
  owner: {
    label: "Owner",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  admin: {
    label: "Admin",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  member: {
    label: "Member",
    className: "bg-muted text-muted-foreground",
  },
};

interface Props {
  groupId: string;
}

export function GroupMembersList({ groupId }: Props) {
  const { data: members = [], isLoading } = useGroupMembers(groupId);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              <div className="h-2.5 w-32 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">No members yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {members.map((member) => {
        const profile = member.profile;
        const name = profile?.full_name ?? "Unknown";
        const { label, className } = roleConfig[member.role];

        return (
          <div key={member.user_id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={name} src={profile?.avatar_url} className="h-10 w-10 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{name}</p>
              {profile?.university && (
                <p className="text-xs text-muted-foreground truncate">{profile.university}</p>
              )}
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                className
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
