import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVENTBRITE_TOKEN = Deno.env.get("EVENTBRITE_API_TOKEN") ?? "";
const REGION = Deno.env.get("DEFAULT_REGION") ?? "CY";

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let total = 0;
  let skipped = 0;

  try {
    if (!EVENTBRITE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "EVENTBRITE_API_TOKEN not set" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) {
      const url =
        `https://www.eventbriteapi.com/v3/events/search/` +
        `?location.address=${encodeURIComponent(REGION)}` +
        `&expand=venue,organizer` +
        `&page=${page}`;

      console.log(`[ingest-eventbrite] Fetching page ${page}: ${url}`);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(
          `[ingest-eventbrite] Eventbrite API error (${res.status}): ${errText}`
        );
        break;
      }

      const data = await res.json();
      const events: Record<string, unknown>[] = data.events ?? [];
      hasMore = data.pagination?.has_more_items ?? false;

      console.log(
        `[ingest-eventbrite] Page ${page}: received ${events.length} events, hasMore=${hasMore}`
      );

      if (events.length === 0) {
        page++;
        continue;
      }

      const rows = events
        .filter((e) => e.id)
        .map((e) => {
          const name = e.name as Record<string, string> | null;
          const description = e.description as Record<string, string> | null;
          const organizer = e.organizer as
            | Record<string, Record<string, string>>
            | null;
          const venue = e.venue as Record<string, unknown> | null;
          const address = venue?.address as Record<string, string> | null;
          const logo = e.logo as
            | Record<string, Record<string, string>>
            | null;
          const start = e.start as Record<string, string> | null;
          const end = e.end as Record<string, string> | null;

          return {
            type: "event" as const,
            title: name?.text ?? "Untitled Event",
            description: description?.text ?? null,
            organization: organizer?.name ?? null,
            location: address?.city ?? address?.country ?? REGION,
            location_type: "in_person" as const,
            url: (e.url as string) ?? null,
            image_url: logo?.original?.url ?? null,
            source: "eventbrite",
            source_id: e.id as string,
            starts_at: start?.utc ?? null,
            ends_at: end?.utc ?? null,
            tags: ["event", "eventbrite"],
          };
        });

      if (rows.length > 0) {
        const { error, data: upserted } = await supabase
          .from("opportunities")
          .upsert(rows, { onConflict: "source,source_id" })
          .select("id");

        if (error) {
          console.error("[ingest-eventbrite] Upsert error:", error.message);
          skipped += rows.length;
        } else {
          const count = upserted?.length ?? rows.length;
          total += count;
          console.log(
            `[ingest-eventbrite] Page ${page}: upserted ${count} records`
          );
        }
      }

      page++;
    }

    console.log(
      `[ingest-eventbrite] Done. Total upserted: ${total}, skipped/errored: ${skipped}`
    );

    return new Response(
      JSON.stringify({ success: true, upserted: total, skipped }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[ingest-eventbrite] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
