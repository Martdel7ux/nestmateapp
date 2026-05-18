import type { ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

export function SearchResultGroup({ label, children }: Props) {
  return (
    <div className="mb-1">
      <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}
