import type { HouseholdMember } from "@/types/household";
import { getMemberInitials } from "@/lib/household-utils";
import { cn } from "@/lib/utils";

const BG_COLORS = [
  "bg-sky-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-indigo-500",
];

function colorFor(userId: string) {
  let hash = 0;
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return BG_COLORS[hash % BG_COLORS.length];
}

interface Props {
  member: HouseholdMember;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MemberAvatar({ member, size = "md", className }: Props) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";
  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt={getMemberInitials(member)}
        loading="lazy"
        decoding="async"
        className={cn("rounded-full object-cover shrink-0", dim, className)}
      />
    );
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center font-bold text-white shrink-0", dim, colorFor(member.user_id), className)}>
      {getMemberInitials(member)}
    </div>
  );
}
