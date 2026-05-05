import type { HTMLAttributes } from "react";
import { cn, initials } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
}

export function Avatar({ name, src, className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
}
