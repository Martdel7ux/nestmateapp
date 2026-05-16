import { cn } from "@/lib/utils";
import type { Course } from "@/types/study";

interface Props {
  course: Course | null | undefined;
  className?: string;
}

export function CourseBadge({ course, className }: Props) {
  if (!course) return null;

  const label = course.code ? `${course.code} — ${course.title}` : course.title;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
      title={label}
    >
      {course.code ? (
        <>
          <span className="font-semibold text-foreground">{course.code}</span>
          <span className="mx-1 text-muted-foreground/50">·</span>
          <span className="max-w-[10rem] truncate">{course.title}</span>
        </>
      ) : (
        <span className="max-w-[12rem] truncate">{course.title}</span>
      )}
    </span>
  );
}
