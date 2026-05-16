import type { UpcomingEvent } from "@/lib/upcoming-events-api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

function getEndDate(event: UpcomingEvent): Date {
  if (event.ends_at) return new Date(event.ends_at);
  const start = new Date(event.starts_at!);
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

/** YYYYMMDDTHHmmssZ — Google Calendar format (no dashes or colons) */
function toGoogleDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

/** ISO 8601 — Outlook format */
function toOutlookDate(d: Date): string {
  return d.toISOString();
}

export function buildGoogleCalendarUrl(event: UpcomingEvent): string {
  if (!event.starts_at) return "#";
  const start = new Date(event.starts_at);
  const end = getEndDate(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    details: event.description ?? "",
    location: event.location ?? "",
    sf: "true",
    output: "xml",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookUrl(event: UpcomingEvent): string {
  if (!event.starts_at) return "#";
  const start = new Date(event.starts_at);
  const end = getEndDate(event);
  const params = new URLSearchParams({
    subject: event.title,
    startdt: toOutlookDate(start),
    enddt: toOutlookDate(end),
    body: event.description ?? "",
    location: event.location ?? "",
    path: "/calendar/action/compose",
    rru: "addevent",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsUrl(opportunityId: string): string {
  if (!SUPABASE_URL) return "#";
  return `${SUPABASE_URL}/functions/v1/generate-ics?opportunity_id=${encodeURIComponent(opportunityId)}`;
}
