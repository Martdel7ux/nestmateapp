// Permanently delete the calling user's account (GDPR right to erasure).
//
// The client cannot do this: deleting an auth.users row requires the service
// role. This function authenticates the caller from their JWT, wipes their
// storage objects (documents, verification ID/selfie, avatar), then deletes the
// auth user — which cascades to `profiles` and every FK-on-delete-cascade row.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, corsHeadersFor } from "../_shared/cors.ts";

/** Recursively remove every object under a storage prefix (best-effort). */
async function emptyFolder(admin: SupabaseClient, bucket: string, prefix: string) {
  try {
    const { data: entries } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (!entries?.length) return;
    const files: string[] = [];
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      // Folders come back with a null id; files have a real id.
      if (entry.id === null) {
        await emptyFolder(admin, bucket, path);
      } else {
        files.push(path);
      }
    }
    if (files.length) await admin.storage.from(bucket).remove(files);
  } catch (e) {
    console.error(`storage cleanup failed for ${bucket}/${prefix}:`, e);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const headers = { ...corsHeadersFor(req), "Content-Type": "application/json" };

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers });
  }

  // Identify the caller from their bearer token.
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const userId = user.id;

  // 1. Remove storage objects keyed by the user id (best-effort, non-fatal).
  await emptyFolder(admin, "documents", userId);
  await emptyFolder(admin, "verification-docs", userId);
  try {
    const { data: avatars } = await admin.storage.from("property-images").list("avatars", { limit: 1000 });
    const userAvatars = (avatars ?? [])
      .filter((f) => f.name.startsWith(userId))
      .map((f) => `avatars/${f.name}`);
    if (userAvatars.length) await admin.storage.from("property-images").remove(userAvatars);
  } catch (e) {
    console.error("avatar cleanup failed:", e);
  }

  // 2. Delete the auth user. Cascades to profiles, profiles_private, and all
  //    rows whose FK to auth.users/profiles is ON DELETE CASCADE.
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("deleteUser failed:", delErr.message);
    return new Response(JSON.stringify({ error: "Account deletion failed. Please contact support." }), {
      status: 500,
      headers,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
});
