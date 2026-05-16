import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeIcal(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcalDate(iso: string): string {
  // YYYYMMDDTHHmmssZ
  return new Date(iso).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function foldLine(line: string): string {
  // iCalendar spec: lines > 75 chars must be folded at 75 chars with CRLF + space
  if (line.length <= 75) return line;
  let result = "";
  let remaining = line;
  let first = true;
  while (remaining.length > 0) {
    const chunk = first ? remaining.slice(0, 75) : remaining.slice(0, 74);
    result += (first ? "" : "\r\n ") + chunk;
    remaining = first ? remaining.slice(75) : remaining.slice(74);
    first = false;
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const opportunityId = url.searchParams.get("opportunity_id");

    if (!opportunityId) {
      return new Response("Missing opportunity_id", { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: opp, error } = await supabase
      .from("opportunities")
      .select("id, title, description, location, starts_at, ends_at, url, organization")
      .eq("id", opportunityId)
      .single();

    if (error || !opp) {
      return new Response("Event not found", { status: 404, headers: corsHeaders });
    }

    if (!opp.starts_at) {
      return new Response("Event has no start date", { status: 422, headers: corsHeaders });
    }

    const startStr = toIcalDate(opp.starts_at);
    const endDate = opp.ends_at
      ? new Date(opp.ends_at)
      : new Date(new Date(opp.starts_at).getTime() + 2 * 60 * 60 * 1000);
    const endStr = toIcalDate(endDate.toISOString());

    const uid = `${opp.id}@nestmate.app`;
    const now = toIcalDate(new Date().toISOString());

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NestMate//NestMate App//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      foldLine(`UID:${uid}`),
      foldLine(`DTSTAMP:${now}`),
      foldLine(`DTSTART:${startStr}`),
      foldLine(`DTEND:${endStr}`),
      foldLine(`SUMMARY:${escapeIcal(opp.title)}`),
    ];

    if (opp.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcal(opp.description)}`));
    }
    if (opp.location) {
      lines.push(foldLine(`LOCATION:${escapeIcal(opp.location)}`));
    }
    if (opp.url) {
      lines.push(foldLine(`URL:${opp.url}`));
    }
    if (opp.organization) {
      lines.push(foldLine(`ORGANIZER;CN=${escapeIcal(opp.organization)}:MAILTO:noreply@nestmate.app`));
    }

    lines.push("END:VEVENT", "END:VCALENDAR");

    const icsContent = lines.join("\r\n") + "\r\n";
    const filename = `${opp.title.replace(/[^a-z0-9]/gi, "_").slice(0, 60)}.ics`;

    return new Response(icsContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("[generate-ics] error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
