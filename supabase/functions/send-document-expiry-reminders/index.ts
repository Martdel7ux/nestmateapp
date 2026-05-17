// Supabase Edge Function: send-document-expiry-reminders
// Schedule: daily at 09:00 UTC
// Sends in-app notifications for documents expiring in 30, 14, or 3 days.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");

interface Document {
  id: string;
  owner_id: string;
  title: string;
  category: string;
  expires_at: string;
  expiry_reminded_30: string | null;
  expiry_reminded_14: string | null;
  expiry_reminded_3: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86_400_000);
}

async function sendInAppNotification(userId: string, title: string, body: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type:    "document_expiry",
    title,
    body,
    is_read: false,
    link:    "/documents/expiring",
  });
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "NestMate <noreply@nestmateapp.com>", to, subject, html }),
  });
}

Deno.serve(async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Fetch all non-deleted documents with future expiry
  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, owner_id, title, category, expires_at, expiry_reminded_30, expiry_reminded_14, expiry_reminded_3")
    .is("deleted_at", null)
    .not("expires_at", "is", null)
    .gte("expires_at", today.toISOString().slice(0, 10));

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0;

  for (const doc of (docs ?? []) as Document[]) {
    const days = daysUntil(doc.expires_at);

    // Determine which reminder window applies
    let window: 30 | 14 | 3 | null = null;
    let reminderField: "expiry_reminded_30" | "expiry_reminded_14" | "expiry_reminded_3" | null = null;

    if (days <= 3  && !doc.expiry_reminded_3)  { window = 3;  reminderField = "expiry_reminded_3";  }
    else if (days <= 14 && !doc.expiry_reminded_14) { window = 14; reminderField = "expiry_reminded_14"; }
    else if (days <= 30 && !doc.expiry_reminded_30) { window = 30; reminderField = "expiry_reminded_30"; }

    if (!window || !reminderField) continue;

    const label = days === 0 ? "today"
      : days === 1 ? "tomorrow"
      : `in ${days} day${days !== 1 ? "s" : ""}`;

    const title   = `Document expiring ${label}`;
    const body    = `"${doc.title}" expires ${label}. Tap to view or update it.`;

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", doc.owner_id)
      .maybeSingle() as { data: UserProfile | null };

    // In-app notification
    await sendInAppNotification(doc.owner_id, title, body);

    // Email if profile has email
    if (profile?.email) {
      await sendEmail(
        profile.email,
        `[NestMate] ${title}`,
        `<p>Hi ${profile.full_name ?? "there"},</p>
         <p>Your document <strong>"${doc.title}"</strong> expires <strong>${label}</strong>.</p>
         <p>Please renew it as soon as possible.</p>
         <p>— NestMate</p>`
      );
    }

    // Mark reminder sent
    await supabase.from("documents").update({ [reminderField]: new Date().toISOString() }).eq("id", doc.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
