/** Days from now until an ISO date (ceil). Null when no date. */
export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Up-to-2-letter initials from a name. */
export function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Short relative label for an event date: Today / Tomorrow / Thu / 24 Oct. */
export function whenLabel(iso?: string | null): string {
  const d = daysUntil(iso);
  if (d === null) return "Soon";
  if (d <= 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d < 7) return new Date(iso!).toLocaleDateString("en-GB", { weekday: "short" });
  return new Date(iso!).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "due in 6 days" / "due today" / "overdue" from a due date + status. */
export function rentDueLabel(dueDate?: string | null): string {
  const d = daysUntil(dueDate);
  if (d === null) return "";
  if (d < 0) return "overdue";
  if (d === 0) return "due today";
  if (d === 1) return "due tomorrow";
  return `due in ${d} days`;
}
