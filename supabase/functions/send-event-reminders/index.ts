import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SaveRow {
  user_id: string;
  opportunity_id: string;
  opportunities: {
    id: string;
    title: string;
    starts_at: string;
    location: string | null;
    url: string | null;
  };
  user_profiles: {
    full_name: string | null;
    notify_email?: boolean;
  } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  try {
    // Find saves where the event starts in ~24 hours (23h–25h window)
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: saves, error: fetchError } = await supabase
      .from("user_opportunity_saves")
      .select(`
        user_id,
        opportunity_id,
        opportunities!inner (
          id,
          title,
          starts_at,
          location,
          url
        ),
        user_profiles!inner (
          full_name
        )
      `)
      .eq("reminder_enabled", true)
      .is("reminder_sent_at", null)
      .gte("opportunities.starts_at", windowStart)
      .lte("opportunities.starts_at", windowEnd)
      .returns<SaveRow[]>();

    if (fetchError) {
      console.error("[send-event-reminders] fetch error:", fetchError.message);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!saves || saves.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const failures: string[] = [];

    for (const row of saves) {
      const opp = row.opportunities;
      const profile = row.user_profiles;

      // Insert in-app discover notification
      const { error: notifError } = await supabase
        .from("discover_notifications")
        .insert({
          user_id: row.user_id,
          type: "event_reminder",
          title: `Reminder: ${opp.title} is tomorrow`,
          body: opp.location ? `📍 ${opp.location}` : null,
          link: opp.url ?? `/discover`,
          opportunity_id: opp.id,
        });

      if (notifError) {
        console.error("[send-event-reminders] notification insert error:", notifError.message);
        failures.push(row.opportunity_id);
        continue;
      }

      // Optional email via Resend
      if (resendApiKey) {
        // Get user email from auth.users via service role
        const { data: authUser } = await supabase.auth.admin.getUserById(row.user_id);
        const email = authUser?.user?.email;

        if (email) {
          const firstName = profile?.full_name?.split(" ")[0] ?? "there";
          const startsAt = new Date(opp.starts_at).toLocaleString("en-GB", {
            weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          });

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "NestMate <reminders@nestmate.app>",
              to: [email],
              subject: `Reminder: "${opp.title}" is tomorrow`,
              html: `
                <p>Hi ${firstName},</p>
                <p>Just a reminder that <strong>${opp.title}</strong> is happening tomorrow at <strong>${startsAt}</strong>.</p>
                ${opp.location ? `<p>📍 ${opp.location}</p>` : ""}
                ${opp.url ? `<p><a href="${opp.url}">View event details</a></p>` : ""}
                <p>— The NestMate team</p>
              `,
            }),
          });
        }
      }

      // Mark reminder as sent
      await supabase
        .from("user_opportunity_saves")
        .update({ reminder_sent_at: now.toISOString() })
        .eq("user_id", row.user_id)
        .eq("opportunity_id", row.opportunity_id);

      sent++;
    }

    console.log(`[send-event-reminders] sent=${sent} failures=${failures.length}`);

    return new Response(JSON.stringify({ sent, failures }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-event-reminders] unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
