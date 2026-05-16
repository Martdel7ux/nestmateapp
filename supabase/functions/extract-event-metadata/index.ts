import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_UA =
  "Mozilla/5.0 (compatible; NestmateBot/1.0; +https://nestmate.app/bot)";

// ── Tag dictionary ──────────────────────────────────────────────────────────

const TAG_DICTIONARY: Record<string, string[]> = {
  tech:       ["tech", "coding", "hackathon", "developer", "startup", "ai", "blockchain", "software"],
  business:   ["business", "entrepreneur", "finance", "marketing", "mba"],
  career:     ["career", "job", "hiring", "internship", "cv", "recruitment", "fair"],
  networking: ["networking", "meetup", "mingle", "social"],
  academic:   ["lecture", "seminar", "conference", "symposium", "research", "academic"],
  arts:       ["art", "exhibition", "gallery", "theatre", "theater", "music", "concert", "film"],
  sports:     ["sport", "football", "basketball", "tennis", "tournament", "fitness"],
  volunteer:  ["volunteer", "charity", "ngo", "community", "fundraiser"],
  student:    ["student", "university", "unic", "ucy", "cut", "euc", "fresher"],
  cyprus:     ["cyprus", "nicosia", "limassol", "larnaca", "paphos"],
  free:       ["free", "no cost", "gratis", "rsvp"],
};

function suggestTags(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_DICTIONARY)) {
    if (keywords.some((kw) => lower.includes(kw))) matched.push(tag);
    if (matched.length >= 4) break;
  }
  return matched;
}

// ── HTML helpers ────────────────────────────────────────────────────────────

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta\\s+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta\\s+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
    new RegExp(`<meta\\s+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta\\s+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
}

function extractH1(html: string): string {
  return html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim() ?? "";
}

// ── JSON-LD ─────────────────────────────────────────────────────────────────

function parseJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch { /* skip malformed */ }
  }
  return results;
}

function findEventJsonLd(blocks: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const block of blocks) {
    const t = block["@type"];
    if (t === "Event" || (Array.isArray(t) && t.includes("Event"))) return block;
    if (block["@graph"]) {
      const items = Array.isArray(block["@graph"]) ? block["@graph"] : [block["@graph"]];
      for (const item of items as Record<string, unknown>[]) {
        const it = item["@type"];
        if (it === "Event" || (Array.isArray(it) && it.includes("Event"))) return item;
      }
    }
  }
  return null;
}

function ldStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (typeof val === "object" && val !== null) {
    const o = val as Record<string, unknown>;
    return String(o.name ?? o["@value"] ?? o.text ?? "");
  }
  return "";
}

// ── Date parsing ────────────────────────────────────────────────────────────

function parseDate(val: unknown): string | null {
  if (!val) return null;
  const str = typeof val === "string" ? val : String(val);
  if (!str.trim()) return null;

  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso.toISOString();

  // DD/MM/YYYY HH:mm
  const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m1) {
    const [, d, mo, y, h = "0", mi = "0"] = m1;
    const d2 = new Date(`${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}:00+02:00`);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }

  // DD MMM YYYY [HH:mm]
  const m2 = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m2) {
    const [, d, mon, y, h = "0", mi = "0"] = m2;
    const d2 = new Date(`${mon} ${d}, ${y} ${h}:${mi}:00 GMT+0200`);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }

  return null;
}

// ── Image caching ───────────────────────────────────────────────────────────

async function cacheImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string
): Promise<{ url: string; warning?: string }> {
  try {
    const resp = await fetch(imageUrl, {
      headers: { "User-Agent": BOT_UA },
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) return { url: imageUrl, warning: "Could not cache image, using external URL" };

    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 5 * 1024 * 1024) {
      return { url: imageUrl, warning: "Image >5MB, using external URL" };
    }

    const ct = resp.headers.get("content-type") ?? "image/jpeg";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(filename, buf, { contentType: ct, cacheControl: "public, max-age=31536000", upsert: false });

    if (error) return { url: imageUrl, warning: "Storage upload failed, using external URL" };

    const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(filename);
    return { url: publicUrl };
  } catch {
    return { url: imageUrl, warning: "Could not cache image, using external URL" };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json() as { url?: string };
    const rawUrl = body.url?.trim();
    if (!rawUrl) return json({ error: "Missing url parameter" }, 400);

    let parsedUrl: URL;
    try { parsedUrl = new URL(rawUrl); }
    catch { return json({ error: "Invalid URL" }, 400); }

    // Instagram block
    if (parsedUrl.hostname.includes("instagram.com")) {
      return json({
        error: "Instagram blocks automated metadata extraction. Please copy details manually.",
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Duplicate check by source_url
    const { data: existing } = await supabase
      .from("opportunities")
      .select("id, title, status")
      .eq("source_url", rawUrl)
      .maybeSingle();

    if (existing) {
      return json({ duplicate: true, existing_id: existing.id, existing_title: existing.title });
    }

    // Fetch page
    let html: string;
    try {
      const resp = await fetch(rawUrl, {
        headers: {
          "User-Agent": BOT_UA,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      const text = await resp.text();
      html = text.length > 2_000_000 ? text.slice(0, 2_000_000) : text;
    } catch (err) {
      return json({ error: `Could not fetch URL: ${String(err)}` });
    }

    // Login wall detection
    const pageTitle = extractTitle(html).toLowerCase();
    if (["log in", "sign in", "login", "create an account"].some((p) => pageTitle.includes(p))) {
      return json({ error: "This URL requires login. Please copy details manually." });
    }

    const rawSnippet = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500).trim();

    // ── Extraction pipeline ─────────────────────────────────────────────────
    let title = "", description = "", image_url = "", starts_at: string | null = null,
        ends_at: string | null = null, location = "", organization = "",
        url = rawUrl, extraction_method = "heuristic", confidence = "low";

    const ldBlocks = parseJsonLd(html);
    const eventLd = findEventJsonLd(ldBlocks);

    if (eventLd) {
      extraction_method = "json-ld";
      confidence = "high";
      title = ldStr(eventLd.name);
      description = ldStr(eventLd.description);
      starts_at = parseDate(eventLd.startDate);
      ends_at = parseDate(eventLd.endDate);
      url = ldStr(eventLd.url) || rawUrl;

      if (eventLd.image) {
        const img = eventLd.image as Record<string, unknown> | string;
        image_url = typeof img === "string" ? img : String(img.url ?? img["@id"] ?? "");
      }

      if (eventLd.location) {
        const loc = eventLd.location as Record<string, unknown>;
        const parts: string[] = [];
        if (loc.name) parts.push(String(loc.name));
        if (loc.address) {
          const a = loc.address;
          if (typeof a === "string") parts.push(a);
          else {
            const ao = a as Record<string, unknown>;
            parts.push([ao.streetAddress, ao.addressLocality, ao.addressCountry].filter(Boolean).join(", "));
          }
        }
        location = parts.join(", ");
      }

      if (eventLd.organizer) {
        organization = ldStr((eventLd.organizer as Record<string, unknown>).name ?? eventLd.organizer);
      }

    } else {
      const ogTitle    = extractMeta(html, "og:title");
      const ogDesc     = extractMeta(html, "og:description");
      const ogImage    = extractMeta(html, "og:image");
      const ogUrl      = extractMeta(html, "og:url");
      const ogStart    = extractMeta(html, "og:start_date") || extractMeta(html, "event:start_time");
      const twTitle    = extractMeta(html, "twitter:title");
      const twDesc     = extractMeta(html, "twitter:description");
      const twImage    = extractMeta(html, "twitter:image");

      if (ogTitle || twTitle) {
        title       = ogTitle || twTitle;
        description = ogDesc || twDesc;
        image_url   = ogImage || twImage;
        url         = ogUrl || rawUrl;
        starts_at   = parseDate(ogStart);
        extraction_method = ogTitle ? "opengraph" : "twitter-card";
        confidence  = (title && starts_at && image_url) ? "medium" : "low";
      } else {
        title       = extractH1(html) || pageTitle;
        description = extractMeta(html, "description");
        const imgM  = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgM?.[1]) image_url = imgM[1];
        extraction_method = "heuristic";
        confidence  = "low";
      }
    }

    // Tag suggestion
    const tags = suggestTags(`${title} ${description}`);

    // Cache image
    let image_warning: string | undefined;
    if (image_url) {
      const cached = await cacheImage(supabase, image_url);
      image_url = cached.url;
      image_warning = cached.warning;
    }

    return json({
      title,
      description,
      image_url,
      starts_at,
      ends_at,
      location,
      organization,
      tags,
      url,
      raw_html_snippet: rawSnippet,
      extraction_method,
      confidence,
      ...(image_warning ? { image_warning } : {}),
    });

  } catch (err) {
    console.error("[extract-event-metadata]", err);
    return json({ error: `Unexpected error: ${String(err)}` }, 500);
  }
});
