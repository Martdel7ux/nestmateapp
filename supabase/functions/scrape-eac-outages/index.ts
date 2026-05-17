// Supabase Edge Function: scrape-eac-outages
// Schedule: daily at 06:00 UTC
// Fetches EAC planned outage announcements and upserts into eac_outages table.
// Bot UA: NestmateBot/1.0 — respectful, daily-only scrape.
// Falls back gracefully — if scrape fails, logs the failure and skips.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL  = Deno.env.get("ADMIN_EMAIL") ?? "martinahoto4@gmail.com";
const EAC_URL      = "https://www.eac.com.cy/EN/customerservice/announcements/planned-maintenance/Pages/default.aspx";

type District = "nicosia" | "limassol" | "larnaca" | "paphos" | "famagusta";

const DISTRICT_KEYWORDS: Record<string, District> = {
  nicosia:   "nicosia",  lefkosia: "nicosia",
  strovolos: "nicosia",  engomi: "nicosia",  aglantzia: "nicosia",
  limassol:  "limassol", lemesos: "limassol",
  larnaca:   "larnaca",  larnaka: "larnaca",
  paphos:    "paphos",   pafos: "paphos",
  famagusta: "famagusta", ammochostos: "famagusta",
};

function detectDistrict(text: string): District | null {
  const lower = text.toLowerCase();
  for (const [kw, district] of Object.entries(DISTRICT_KEYWORDS)) {
    if (lower.includes(kw)) return district;
  }
  return null;
}

function hashOutage(date: string, area: string, streets: string): string {
  const raw = `${date}|${area}|${streets}`.toLowerCase().replace(/\s+/g, "");
  // Simple hash — good enough for deduplication
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

async function logResult(success: boolean, message: string) {
  await supabase.from("scraper_logs").insert({ scraper: "scrape-eac-outages", success, message });
}

async function checkConsecutiveFailures(): Promise<number> {
  const { data } = await supabase
    .from("scraper_logs")
    .select("success")
    .eq("scraper", "scrape-eac-outages")
    .order("created_at", { ascending: false })
    .limit(3);
  if (!data || data.length < 3) return 0;
  return data.every((r: { success: boolean }) => !r.success) ? 3 : 0;
}

async function alertAdmin(message: string) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "NestMate <noreply@nestmateapp.com>",
      to: ADMIN_EMAIL,
      subject: "[NestMate] EAC scraper has failed 3 days in a row",
      html: `<p>The EAC outage scraper has failed 3 consecutive times.</p><pre>${message}</pre>`,
    }),
  });
}

interface ParsedOutage {
  source_id: string;
  starts_at: string;
  ends_at: string;
  district: District | null;
  area: string;
  streets: string[];
  reason: string | null;
  source_url: string;
  raw_text: string;
}

function parseEacHtml(html: string): ParsedOutage[] {
  const outages: ParsedOutage[] = [];

  // EAC typically has a table or list of announcements.
  // We look for common patterns in their HTML structure.
  // Pattern: div/td containing date range + area description.

  // Try to find announcement blocks — EAC uses various class names
  const blockPatterns = [
    /<tr[^>]*>[\s\S]*?<\/tr>/gi,
    /<div[^>]*class="[^"]*announcement[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    /<li[^>]*>[\s\S]*?<\/li>/gi,
  ];

  // Date pattern: common formats used on EAC site (DD/MM/YYYY, Month DD YYYY)
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/g;
  const timeRegex = /(\d{1,2})[:\.](\d{2})\s*(am|pm|AM|PM)?/g;

  // Fallback: try to extract text blocks and parse them
  const cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "")
                        .replace(/<style[\s\S]*?<\/style>/gi, "");
  const textContent = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  // Split by potential announcement separators
  const chunks = textContent.split(/(?=\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/);

  for (const chunk of chunks) {
    if (chunk.trim().length < 20) continue;

    const dateMatches = [...chunk.matchAll(dateRegex)];
    if (dateMatches.length === 0) continue;

    const firstDate = dateMatches[0];
    const day = parseInt(firstDate[1]);
    const month = parseInt(firstDate[2]) - 1;
    const year = parseInt(firstDate[3]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) continue;

    // Try to extract times
    const timeMatches = [...chunk.matchAll(timeRegex)];
    let startHour = 8, endHour = 14;
    if (timeMatches.length >= 1) {
      startHour = parseInt(timeMatches[0][1]);
      if (timeMatches[0][3]?.toLowerCase() === "pm" && startHour < 12) startHour += 12;
    }
    if (timeMatches.length >= 2) {
      endHour = parseInt(timeMatches[1][1]);
      if (timeMatches[1][3]?.toLowerCase() === "pm" && endHour < 12) endHour += 12;
    }

    const starts = new Date(Date.UTC(year, month, day, startHour, 0));
    const ends   = new Date(Date.UTC(year, month, day, endHour, 0));

    if (isNaN(starts.getTime())) continue;
    if (ends <= starts) ends.setUTCHours(starts.getUTCHours() + 4);

    // Skip past outages (> 7 days old)
    if (ends < new Date(Date.now() - 7 * 86400_000)) continue;

    const district = detectDistrict(chunk);
    const area     = detectArea(chunk);
    const streets  = extractStreets(chunk);

    const sourceId = hashOutage(starts.toISOString().slice(0, 10), area, streets.join(","));

    outages.push({
      source_id: sourceId,
      starts_at: starts.toISOString(),
      ends_at:   ends.toISOString(),
      district,
      area,
      streets,
      reason:    "Planned maintenance",
      source_url: EAC_URL,
      raw_text:  chunk.slice(0, 500),
    });
  }

  return outages;
}

function detectArea(text: string): string {
  // Look for capitalized words / place names
  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) ?? [];
  const filtered = matches.filter((m) => m.length > 3 && !["January","February","March","April","May","June","July","August","September","October","November","December","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].includes(m));
  return filtered[0] ?? "Unknown area";
}

function extractStreets(text: string): string[] {
  const streets: string[] = [];
  const patterns = [
    /(?:street|st\.|avenue|ave\.|road|rd\.)[^,\n]{0,40}/gi,
    /(?:οδό[ς]?\s+|λεωφόρο[ς]?\s+)[Α-Ωα-ω\s]+/g,
  ];
  for (const p of patterns) {
    const m = text.match(p) ?? [];
    streets.push(...m.map((s) => s.trim()));
  }
  return [...new Set(streets)].slice(0, 10);
}

Deno.serve(async () => {
  let fetched = false;
  let html    = "";

  try {
    const res = await fetch(EAC_URL, {
      headers: {
        "User-Agent": "NestmateBot/1.0 (+https://nestmateapp.com/bot)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) throw new Error(`EAC returned HTTP ${res.status}`);
    html    = await res.text();
    fetched = true;
  } catch (err) {
    const msg = `Fetch failed: ${(err as Error).message}`;
    await logResult(false, msg);
    const consecutive = await checkConsecutiveFailures();
    if (consecutive >= 3) await alertAdmin(msg);
    return new Response(JSON.stringify({ error: msg }), { status: 200 });
  }

  let parsed: ParsedOutage[] = [];
  try {
    parsed = parseEacHtml(html);
  } catch (err) {
    const msg = `Parse failed: ${(err as Error).message}`;
    await logResult(false, msg);
    return new Response(JSON.stringify({ error: msg }), { status: 200 });
  }

  let upserted = 0;
  for (const outage of parsed) {
    const { error } = await supabase
      .from("eac_outages")
      .upsert(outage, { onConflict: "source_id", ignoreDuplicates: true });
    if (!error) upserted++;
  }

  await logResult(true, `Fetched ${html.length} bytes, parsed ${parsed.length} outages, upserted ${upserted}`);

  return new Response(JSON.stringify({ fetched, parsed: parsed.length, upserted }), { status: 200 });
});
