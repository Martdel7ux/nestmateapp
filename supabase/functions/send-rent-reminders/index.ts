import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Web Push (VAPID) ──────────────────────────────────────────────────────────

function base64UrlDecode(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  const binary = atob(padded);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

async function buildVapidJwt(audience: string, subject: string, privateKeyB64: string): Promise<string> {
  const header  = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const unsigned = `${encode(header)}.${encode(payload)}`;

  const keyData = base64UrlDecode(privateKeyB64);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${unsigned}.${sigB64}`;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url: string },
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const url    = new URL(subscription.endpoint);
    const origin = url.origin;
    const jwt    = await buildVapidJwt(origin, vapidSubject, vapidPrivateKey);

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `vapid t=${jwt},k=${vapidPublicKey}`,
        "TTL":           "86400",
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error("[send-rent-reminders] web push error:", err);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const resendApiKey    = Deno.env.get("RESEND_API_KEY");
  const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidSubject    = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@nestmate.app";
  const appUrl          = Deno.env.get("APP_URL") ?? "https://nestmate.app";

  const todayStr = new Date().toISOString().slice(0, 10);
  const today    = new Date(todayStr);

  let remindsSent = 0;
  let followupsSent = 0;
  let markedLate = 0;

  try {
    // ── 1. Mark late ──────────────────────────────────────────────────────────
    const { data: lateRows } = await supabase
      .from("rent_payments")
      .update({ status: "late" })
      .lt("due_date", todayStr)
      .in("status", ["upcoming", "reminded", "due_today"])
      .select("id");

    markedLate = lateRows?.length ?? 0;

    // ── 2. Early reminders (N days before) ───────────────────────────────────
    // Join with agreements to get reminder_days_before per agreement
    const { data: upcoming, error: upErr } = await supabase
      .from("rent_payments")
      .select(`
        id, due_date, amount, currency, status,
        rent_agreements!inner (
          user_id, landlord_name, reminder_days_before,
          reminder_followup_on_due_day, reminder_channels
        )
      `)
      .eq("status", "upcoming")
      .is("reminded_at", null)
      .gte("due_date", todayStr);

    if (upErr) throw upErr;

    for (const row of (upcoming ?? [])) {
      const ag      = row.rent_agreements as {
        user_id: string; landlord_name: string | null;
        reminder_days_before: number; reminder_followup_on_due_day: boolean;
        reminder_channels: string[];
      };
      const dueDate = new Date(row.due_date);
      const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

      if (daysUntil !== ag.reminder_days_before) continue;

      const dueLabel   = dueDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
      const amountStr  = `€${Number(row.amount).toFixed(2)}`;
      const landlord   = ag.landlord_name ?? "your landlord";
      const title      = `Rent due ${dueDate.toLocaleDateString("en-GB", { weekday: "long" })}`;
      const body       = `${amountStr} to ${landlord} · ${dueLabel}`;
      const link       = `/rent/payments/${row.id}`;

      // In-app notification
      await supabase.from("notifications").insert({
        recipient_id: ag.user_id,
        type:         "rent_reminder",
        title,
        body,
        link,
      });

      // Web push
      if (ag.reminder_channels.includes("push") && vapidPrivateKey) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", ag.user_id);

        for (const sub of (subs ?? [])) {
          await sendWebPush(sub, { title, body, url: `${appUrl}${link}` },
            vapidPublicKey, vapidPrivateKey, vapidSubject);
          await supabase.from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("endpoint", sub.endpoint);
        }
      }

      // Email
      if (ag.reminder_channels.includes("email") && resendApiKey) {
        const { data: authUser } = await supabase.auth.admin.getUserById(ag.user_id);
        const email = authUser?.user?.email;
        if (email) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "NestMate <reminders@nestmate.app>",
              to: [email],
              subject: title,
              html: `<p>Hi,</p><p>Your rent of <strong>${amountStr}</strong> to <strong>${landlord}</strong> is due on <strong>${dueLabel}</strong>.</p><p><a href="${appUrl}${link}">View details & mark as paid →</a></p><p>— NestMate</p>`,
            }),
          });
        }
      }

      // Mark reminded
      await supabase.from("rent_payments")
        .update({ reminded_at: new Date().toISOString(), status: "reminded" })
        .eq("id", row.id);

      remindsSent++;
    }

    // ── 3. Follow-up on due day ───────────────────────────────────────────────
    const { data: dueToday, error: dtErr } = await supabase
      .from("rent_payments")
      .select(`
        id, amount, currency,
        rent_agreements!inner (
          user_id, landlord_name, reminder_followup_on_due_day, reminder_channels
        )
      `)
      .eq("due_date", todayStr)
      .in("status", ["upcoming", "reminded"])
      .is("followup_sent_at", null);

    if (dtErr) throw dtErr;

    for (const row of (dueToday ?? [])) {
      const ag = row.rent_agreements as {
        user_id: string; landlord_name: string | null;
        reminder_followup_on_due_day: boolean; reminder_channels: string[];
      };

      if (!ag.reminder_followup_on_due_day) continue;

      const amountStr = `€${Number(row.amount).toFixed(2)}`;
      const landlord  = ag.landlord_name ?? "your landlord";
      const title     = "Rent is due today";
      const body      = `${amountStr} to ${landlord} · One tap to mark as paid`;
      const link      = `/rent/payments/${row.id}`;

      await supabase.from("notifications").insert({
        recipient_id: ag.user_id,
        type:         "rent_reminder",
        title,
        body,
        link,
      });

      if (ag.reminder_channels.includes("push") && vapidPrivateKey) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", ag.user_id);

        for (const sub of (subs ?? [])) {
          await sendWebPush(sub, { title, body, url: `${appUrl}${link}` },
            vapidPublicKey, vapidPrivateKey, vapidSubject);
        }
      }

      await supabase.from("rent_payments")
        .update({ followup_sent_at: new Date().toISOString(), status: "due_today" })
        .eq("id", row.id);

      followupsSent++;
    }

    console.log(`[send-rent-reminders] remindsSent=${remindsSent} followupsSent=${followupsSent} markedLate=${markedLate}`);

    return new Response(JSON.stringify({ remindsSent, followupsSent, markedLate }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-rent-reminders] unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
