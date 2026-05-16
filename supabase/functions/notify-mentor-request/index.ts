// Deno Edge Function - notify-mentor-request
// Input: { mentor_request_id: string }
// Fetches the mentor request and notifies the mentor via in-app notification + optional email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MentorRequest {
  id: string;
  requester_id: string;
  mentor_id: string;
  course_id: string;
  message: string | null;
  status: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  notify_email?: boolean;
  email?: string | null;
}

interface Course {
  id: string;
  title: string;
  code: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const mentorRequestId: string = body.mentor_request_id;
    if (!mentorRequestId) {
      return new Response(JSON.stringify({ error: "mentor_request_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the mentor request
    const { data: mentorRequest, error: reqError } = await supabase
      .from("mentor_requests")
      .select("*")
      .eq("id", mentorRequestId)
      .maybeSingle();

    if (reqError || !mentorRequest) {
      return new Response(JSON.stringify({ error: "Mentor request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mr = mentorRequest as MentorRequest;

    // Fetch requester profile, mentor profile, and course in parallel
    const [{ data: requesterData }, { data: mentorData }, { data: courseData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", mr.requester_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, avatar_url, notify_email").eq("id", mr.mentor_id).maybeSingle(),
      supabase.from("courses").select("id, title, code").eq("id", mr.course_id).maybeSingle(),
    ]);

    const requester = requesterData as Profile | null;
    const mentor = mentorData as (Profile & { notify_email?: boolean }) | null;
    const course = courseData as Course | null;

    if (!requester || !mentor || !course) {
      return new Response(JSON.stringify({ error: "Related data not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseLabel = course.code ? `${course.code} — ${course.title}` : course.title;
    const notificationTitle = "New mentor request";
    const notificationBody = `${requester.full_name} has requested you as a mentor for ${courseLabel}.`;
    const notificationLink = `/study/courses`;

    // Insert in-app notification into discover_notifications table
    await supabase.from("discover_notifications").insert({
      user_id: mr.mentor_id,
      type: "mentor_request",
      title: notificationTitle,
      body: notificationBody,
      link: notificationLink,
    });

    // Optionally send email via Resend if mentor has email notifications enabled
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && mentor.notify_email && mentor.email) {
      const emailPayload = {
        from: "NestMate Study Hub <noreply@nestmate.app>",
        to: [mentor.email],
        subject: notificationTitle,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">New Mentor Request</h2>
            <p style="color: #444;">${notificationBody}</p>
            ${mr.message ? `<blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #666;">${mr.message}</blockquote>` : ""}
            <a href="${Deno.env.get("SITE_URL") ?? "https://nestmate.app"}${notificationLink}"
               style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #6366f1; color: white; border-radius: 8px; text-decoration: none;">
              View Request
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #999;">
              You can manage your notification preferences in your profile settings.
            </p>
          </div>
        `,
      };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
