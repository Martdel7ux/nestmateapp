import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function MentorBadge({ className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        className
      )}
    >
      <GraduationCap size={11} />
      Mentor
    </span>
  );
}
