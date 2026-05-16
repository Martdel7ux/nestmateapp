import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "notifications@nestmate.app";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://nestmate.app";

// How far back to look for "new" opportunities (1 hour)
const OPPORTUNITY_WINDOW_HOURS = 1;
// How long since last notification before we notify again (1 hour)
const NOTIFY_COOLDOWN_HOURS = 1;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPreference {
  user_id: string;
  interested_types: string[];
  interested_tags: string[];
  location: string | null;
  remote_ok: boolean;
  notify_email: boolean;
  notify_inapp: boolean;
  notify_frequency: "instant" | "daily" | "weekly";
}

interface Opportunity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  organization: string | null;
  location: string | null;
  location_type: string;
  tags: string[];
  created_at: string;
}

interface NotificationInsert {
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  opportunity_id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function opportunityMatchesPreferences(
  opp: Opportunity,
  pref: UserPreference
): boolean {
  // Type filter
  if (
    pref.interested_types.length > 0 &&
    !pref.interested_types.includes(opp.type)
  ) {
    return false;
  }

  // Location filter
  const isRemote = opp.location_type === "remote";
  if (!pref.remote_ok && isRemote) return false;

  if (pref.location && !isRemote) {
    const prefLocation = pref.location.toLowerCase();
    const oppLocation = (opp.location ?? "").toLowerCase();
    if (!oppLocation.includes(prefLocation) && !prefLocation.includes(oppLocation)) {
      // Don't exclude if no location pref set or if remote is ok and it's remote
      if (opp.location_type !== "hybrid") return false;
    }
  }

  // Tag filter — if user has tag preferences, at least one must match
  if (pref.interested_tags.length > 0) {
    const oppTags = opp.tags ?? [];
    const hasMatch = pref.interested_tags.some((t) => oppTags.includes(t));
    if (!hasMatch) return false;
  }

  return true;
}

function buildNotificationBody(opp: Opportunity): string {
  const parts: string[] = [];
  if (opp.organization) parts.push(`by ${opp.organization}`);
  if (opp.location) parts.push(`in ${opp.location}`);
  if (parts.length > 0) return parts.join(" · ");
  return opp.description?.slice(0, 120) ?? "";
}

function buildOpportunityLink(opp: Opportunity): string {
  return `${APP_BASE_URL}/discover/${opp.id}`;
}

async function sendResendEmail(
  toEmail: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[send-notifications] RESEND_API_KEY not set; skipping email");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[send-notifications] Resend error for ${toEmail}: ${err}`);
    return false;
  }

  return true;
}

function buildEmailHtml(
  opportunities: Opportunity[],
  userName: string
): string {
  const rows = opportunities
    .slice(0, 5) // cap at 5 per email
    .map(
      (opp) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <a href="${buildOpportunityLink(opp)}"
             style="font-weight:600;color:#6C63FF;text-decoration:none;font-size:15px;">
            ${opp.title}
          </a><br/>
          <span style="color:#888;font-size:13px;">
            ${opp.organization ?? ""}${opp.location ? ` · ${opp.location}` : ""}
          </span>
        </td>
      </tr>`
    )
    .join("");

  const moreCount = Math.max(0, opportunities.length - 5);
  const moreText =
    moreCount > 0
      ? `<p style="color:#888;font-size:13px;">…and ${moreCount} more on the NestMate Discover page.</p>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#6C63FF;padding:28px 32px;">
              <h1 style="color:#fff;margin:0;font-size:22px;">NestMate Discover</h1>
              <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">
                New opportunities matched for you
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="color:#333;font-size:15px;margin:0 0 20px;">
                Hi ${userName}, here are the latest opportunities we found for you:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
              ${moreText}
              <div style="margin-top:28px;text-align:center;">
                <a href="${APP_BASE_URL}/discover"
                   style="background:#6C63FF;color:#fff;padding:12px 28px;border-radius:8px;
                          text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
                  View all on NestMate
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f0f0f0;">
              <p style="color:#aaa;font-size:12px;margin:0;">
                You received this email because you have instant notifications enabled in your
                <a href="${APP_BASE_URL}/settings/notifications" style="color:#6C63FF;">NestMate preferences</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let inAppSent = 0;
  let emailsSent = 0;
  let usersProcessed = 0;

  try {
    const now = new Date();
    const opportunityWindowStart = new Date(
      now.getTime() - OPPORTUNITY_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();
    const cooldownCutoff = new Date(
      now.getTime() - NOTIFY_COOLDOWN_HOURS * 60 * 60 * 1000
    ).toISOString();

    // ── 1. Fetch all user preferences ─────────────────────────────────────────
    const { data: preferences, error: prefErr } = await supabase
      .from("user_opportunity_preferences")
      .select("*");

    if (prefErr) {
      console.error("[send-notifications] Failed to fetch preferences:", prefErr.message);
      return new Response(
        JSON.stringify({ error: prefErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!preferences || preferences.length === 0) {
      console.log("[send-notifications] No user preferences found; exiting");
      return new Response(
        JSON.stringify({ success: true, inAppSent: 0, emailsSent: 0, usersProcessed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-notifications] Processing ${preferences.length} users`);

    // ── 2. Fetch new opportunities in the window ───────────────────────────────
    const { data: newOpportunities, error: oppErr } = await supabase
      .from("opportunities")
      .select("id, type, title, description, organization, location, location_type, tags, created_at")
      .gte("created_at", opportunityWindowStart)
      .order("created_at", { ascending: false });

    if (oppErr) {
      console.error("[send-notifications] Failed to fetch opportunities:", oppErr.message);
      return new Response(
        JSON.stringify({ error: oppErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!newOpportunities || newOpportunities.length === 0) {
      console.log("[send-notifications] No new opportunities in the last hour; exiting");
      return new Response(
        JSON.stringify({ success: true, inAppSent: 0, emailsSent: 0, usersProcessed: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[send-notifications] Found ${newOpportunities.length} new opportunities`
    );

    // ── 3. Fetch recently notified users (cooldown check) ─────────────────────
    const { data: recentNotifications } = await supabase
      .from("discover_notifications")
      .select("user_id, created_at")
      .gte("created_at", cooldownCutoff);

    const recentlyNotifiedUsers = new Set<string>(
      (recentNotifications ?? []).map((n: { user_id: string }) => n.user_id)
    );

    // ── 4. Fetch user emails from auth.users via the admin API ─────────────────
    // We need emails for the email notifications.
    const userIds = (preferences as UserPreference[]).map((p) => p.user_id);
    const userEmailMap = new Map<string, string>();

    // Fetch in batches of 10 to avoid large payloads
    const EMAIL_BATCH = 10;
    for (let i = 0; i < userIds.length; i += EMAIL_BATCH) {
      const batch = userIds.slice(i, i + EMAIL_BATCH);
      const { data: users } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: EMAIL_BATCH,
      });
      // Note: listUsers doesn't support filtering by ID in all versions.
      // We collect all and match below.
      if (users?.users) {
        for (const u of users.users) {
          if (u.email) userEmailMap.set(u.id, u.email);
        }
      }
    }

    // ── 5. Process each user ───────────────────────────────────────────────────
    for (const pref of preferences as UserPreference[]) {
      // Skip if notified recently (cooldown)
      if (recentlyNotifiedUsers.has(pref.user_id)) {
        console.log(
          `[send-notifications] User ${pref.user_id} notified recently; skipping`
        );
        continue;
      }

      // Skip if user has all notifications disabled
      if (!pref.notify_inapp && !pref.notify_email) continue;

      // Filter opportunities to those matching this user's preferences
      const matched = (newOpportunities as Opportunity[]).filter((opp) =>
        opportunityMatchesPreferences(opp, pref)
      );

      if (matched.length === 0) {
        console.log(
          `[send-notifications] No matching opportunities for user ${pref.user_id}`
        );
        continue;
      }

      console.log(
        `[send-notifications] User ${pref.user_id}: ${matched.length} matched opportunities`
      );
      usersProcessed++;

      // ── 5a. Insert in-app discover_notifications ────────────────────────────
      if (pref.notify_inapp) {
        const inAppRows: NotificationInsert[] = matched.map((opp) => ({
          user_id: pref.user_id,
          type: "new_opportunity",
          title: `New ${opp.type}: ${opp.title}`,
          body: buildNotificationBody(opp),
          link: buildOpportunityLink(opp),
          opportunity_id: opp.id,
        }));

        const { error: insertErr } = await supabase
          .from("discover_notifications")
          .insert(inAppRows);

        if (insertErr) {
          console.error(
            `[send-notifications] In-app insert error for user ${pref.user_id}:`,
            insertErr.message
          );
        } else {
          inAppSent += inAppRows.length;
          console.log(
            `[send-notifications] Inserted ${inAppRows.length} in-app notifications for user ${pref.user_id}`
          );
        }
      }

      // ── 5b. Send email for instant-frequency users ─────────────────────────
      if (pref.notify_email && pref.notify_frequency === "instant") {
        const userEmail = userEmailMap.get(pref.user_id);
        if (!userEmail) {
          console.warn(
            `[send-notifications] No email found for user ${pref.user_id}; skipping email`
          );
          continue;
        }

        const subject =
          matched.length === 1
            ? `New opportunity on NestMate: ${matched[0].title}`
            : `${matched.length} new opportunities matched for you on NestMate`;

        const html = buildEmailHtml(matched, userEmail.split("@")[0]);
        const sent = await sendResendEmail(userEmail, subject, html);
        if (sent) {
          emailsSent++;
          console.log(
            `[send-notifications] Email sent to ${userEmail} (${matched.length} opportunities)`
          );
        }
      }
    }

    console.log(
      `[send-notifications] Done. Users processed: ${usersProcessed}, ` +
        `in-app notifications: ${inAppSent}, emails sent: ${emailsSent}`
    );

    return new Response(
      JSON.stringify({ success: true, inAppSent, emailsSent, usersProcessed }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[send-notifications] Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
