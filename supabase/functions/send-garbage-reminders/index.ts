// Supabase Edge Function: send-garbage-reminders
// Schedule: daily at 19:00 UTC (9pm Cyprus time — evening before collection)
// Sends in-app + push notifications for tomorrow's garbage collection.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY");

interface GarbageSchedule {
  city: string;
  area: string;
  general_waste_days: number[];
  recycling_days: number[];
  organic_days: number[];
}

interface Profile {
  id: string;
  city: string | null;
  area: string | null;
  garbage_reminder_enabled: boolean;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const CITY_MAP: Record<string, string> = {
  Nicosia: "nicosia", Limassol: "limassol", Larnaca: "larnaca",
  Paphos: "paphos", Famagusta: "nicosia", Kyrenia: "nicosia",
};

function tomorrowDayOfWeek(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getDay(); // 0=Sun..6=Sat
}

function buildCollectionLabel(schedule: GarbageSchedule, tomorrow: number): string | null {
  const types: string[] = [];
  if (schedule.general_waste_days.includes(tomorrow)) types.push("general waste");
  if (schedule.recycling_days.includes(tomorrow))     types.push("recycling");
  if (schedule.organic_days.includes(tomorrow))       types.push("organic");
  if (types.length === 0) return null;
  return types.join(" & ");
}

async function sendPush(sub: PushSub, payload: string) {
  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) return;
  // Build VAPID JWT
  const now = Math.floor(Date.now() / 1000);
  const origin = new URL(sub.endpoint).origin;
  const header  = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims  = btoa(JSON.stringify({ aud: origin, exp: now + 86400, sub: "mailto:noreply@nestmateapp.com" }));
  const signingInput = `${header}.${claims}`;

  const keyData = atob(VAPID_PRIVATE_KEY.replace(/-/g, "+").replace(/_/g, "/"));
  const keyBytes = new Uint8Array(keyData.split("").map((c) => c.charCodeAt(0)));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyBytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;

  await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: new TextEncoder().encode(payload),
  });
}

Deno.serve(async () => {
  const tomorrow = tomorrowDayOfWeek();
  let sent = 0;

  // Fetch all users with garbage reminders enabled
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, city, area, garbage_reminder_enabled")
    .eq("garbage_reminder_enabled", true)
    .not("area", "is", null)
    .not("city", "is", null) as { data: Profile[] | null };

  if (!profiles || profiles.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  for (const profile of profiles) {
    const cityKey = CITY_MAP[profile.city ?? ""] ?? profile.city?.toLowerCase();
    const area    = profile.area;
    if (!cityKey || !area) continue;

    // Get garbage schedule for this user's area
    const { data: schedule } = await supabase
      .from("garbage_schedules")
      .select("city, area, general_waste_days, recycling_days, organic_days")
      .eq("city", cityKey)
      .ilike("area", area)
      .maybeSingle() as { data: GarbageSchedule | null };

    if (!schedule) continue;

    const collectionLabel = buildCollectionLabel(schedule, tomorrow);
    if (!collectionLabel) continue;

    const title = "Garbage day tomorrow";
    const body  = `${collectionLabel.charAt(0).toUpperCase() + collectionLabel.slice(1)} collection in ${schedule.area} tomorrow.`;

    // In-app notification
    await supabase.from("notifications").insert({
      user_id: profile.id,
      type:    "garbage_reminder",
      title,
      body,
      is_read: false,
      link:    "/tools/garbage",
    });

    // Push notification
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", profile.id) as { data: PushSub[] | null };

    const pushPayload = JSON.stringify({ title, body, url: "/tools/garbage" });
    for (const sub of subs ?? []) {
      try { await sendPush(sub, pushPayload); } catch { /* non-fatal */ }
    }

    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
