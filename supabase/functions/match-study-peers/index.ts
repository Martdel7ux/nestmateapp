// Deno Edge Function - match-study-peers
// Input: { course_id: string }
// Returns ranked list of peers for a given course

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { course_id } = await req.json();
    if (!course_id) return new Response(JSON.stringify({ error: "course_id required" }), { status: 400, headers: corsHeaders });

    // Get requester's university
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("university")
      .eq("id", user.id)
      .maybeSingle();

    // Get blocked user IDs
    const { data: blockedRows } = await supabase
      .from("study_blocked_users")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = (blockedRows ?? []).map((r: { blocked_id: string }) => r.blocked_id);

    // Find peers taking or who have taken this course
    const { data: peers } = await supabase
      .from("user_courses")
      .select(`
        user_id, status, is_mentor,
        profiles!inner(id, full_name, avatar_url, university)
      `)
      .eq("course_id", course_id)
      .neq("user_id", user.id);

    const filtered = (peers ?? []).filter((p: { user_id: string }) => !blockedIds.includes(p.user_id));

    // Rank: mentors first, then same university, then alphabetically
    const ranked = filtered.sort((
      a: { is_mentor: boolean; profiles: { university: string } },
      b: { is_mentor: boolean; profiles: { university: string } }
    ) => {
      if (a.is_mentor && !b.is_mentor) return -1;
      if (!a.is_mentor && b.is_mentor) return 1;
      const aUni = a.profiles?.university === requesterProfile?.university ? 1 : 0;
      const bUni = b.profiles?.university === requesterProfile?.university ? 1 : 0;
      return bUni - aUni;
    }).slice(0, 25);

    return new Response(JSON.stringify(ranked), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
