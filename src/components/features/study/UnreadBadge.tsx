interface Props {
  count: number;
}

export function UnreadBadge({ count }: Props) {
  if (count <= 0) return null;

  return (
    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
