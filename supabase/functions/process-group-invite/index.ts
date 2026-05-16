// Deno Edge Function - process-group-invite
// Input: { group_id: string, action: 'request' | 'accept' | 'decline', target_user_id?: string }
// Manages study group membership requests and notifications.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudyGroup {
  id: string;
  name: string;
  created_by: string | null;
}

interface Profile {
  id: string;
  full_name: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { group_id, action, target_user_id } = body as {
      group_id: string;
      action: "request" | "accept" | "decline";
      target_user_id?: string;
    };

    if (!group_id || !action) {
      return new Response(JSON.stringify({ error: "group_id and action are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch group info
    const { data: groupData } = await supabase
      .from("study_groups")
      .select("id, name, created_by")
      .eq("id", group_id)
      .maybeSingle();

    if (!groupData) {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const group = groupData as StudyGroup;

    if (action === "request") {
      // User is requesting to join a private group — notify group owner
      const { data: requesterData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .maybeSingle();

      const requester = requesterData as Profile | null;
      const ownerId = group.created_by;

      if (ownerId && requester) {
        await supabase.from("discover_notifications").insert({
          user_id: ownerId,
          type: "group_join_request",
          title: "New join request",
          body: `${requester.full_name} wants to join your study group "${group.name}".`,
          link: `/study/groups/${group_id}`,
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Join request sent to group owner." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accept") {
      // Owner/admin is accepting a user — target_user_id is the user to add
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required for accept action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify caller is owner or admin
      const { data: callerMembership } = await supabase
        .from("study_group_members")
        .select("role")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
        return new Response(JSON.stringify({ error: "Only group owners or admins can accept requests" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add target user as member
      const { error: insertError } = await supabase
        .from("study_group_members")
        .upsert({ group_id, user_id: target_user_id, role: "member" });

      if (insertError) {
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify target user
      await supabase.from("discover_notifications").insert({
        user_id: target_user_id,
        type: "group_join_accepted",
        title: "Join request accepted",
        body: `You have been added to the study group "${group.name}".`,
        link: `/study/groups/${group_id}`,
      });

      return new Response(JSON.stringify({ success: true, message: "User added to group." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "decline") {
      // Owner/admin declining a request — target_user_id is the declined user
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required for decline action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify caller is owner or admin
      const { data: callerMembership } = await supabase
        .from("study_group_members")
        .select("role")
        .eq("group_id", group_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
        return new Response(JSON.stringify({ error: "Only group owners or admins can decline requests" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Notify target user of decline
      await supabase.from("discover_notifications").insert({
        user_id: target_user_id,
        type: "group_join_declined",
        title: "Join request declined",
        body: `Your request to join "${group.name}" was not accepted at this time.`,
        link: `/study/groups`,
      });

      return new Response(JSON.stringify({ success: true, message: "Request declined." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
