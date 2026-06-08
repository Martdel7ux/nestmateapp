import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor } from "./cors.ts";

/** Decode the `sub` (user id) claim from a Supabase JWT without a round-trip.
 *  Safe because the function gateway already verified the token (verify_jwt). */
function userIdFromAuthHeader(authHeader: string): string | null {
  if (!authHeader.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

export interface RateLimitRule {
  /** Stable name for the limit window, e.g. "assistant" or "assistant:day". */
  bucket: string;
  /** Max requests allowed within the window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

function jsonResponse(
  request: Request,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(request), "Content-Type": "application/json", ...extraHeaders },
  });
}

/**
 * Enforce one or more per-user rate-limit rules. Returns a ready-to-send
 * Response (401 if unauthenticated, 429 if over a limit) when the request
 * should be rejected, or `null` when it may proceed.
 *
 * Fails open on limiter/infra errors so a transient outage never disables the
 * underlying feature.
 */
export async function enforceRateLimit(
  request: Request,
  rules: RateLimitRule | RateLimitRule[]
): Promise<Response | null> {
  const userId = userIdFromAuthHeader(request.headers.get("Authorization") ?? "");
  if (!userId) {
    return jsonResponse(request, 401, { error: "Authentication required." });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return null; // misconfigured → fail open

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const ruleList = Array.isArray(rules) ? rules : [rules];

  for (const rule of ruleList) {
    try {
      const { data, error } = await admin.rpc("consume_rate_limit", {
        _user_id: userId,
        _bucket: rule.bucket,
        _max: rule.max,
        _window_seconds: rule.windowSeconds,
      });
      if (error) {
        console.error(`rate-limit rpc error (${rule.bucket}):`, error.message);
        continue; // fail open for this rule
      }
      if (data === false) {
        return jsonResponse(
          request,
          429,
          { error: "You're doing that too often. Please wait a moment and try again." },
          { "Retry-After": String(rule.windowSeconds) }
        );
      }
    } catch (e) {
      console.error(`rate-limit exception (${rule.bucket}):`, e);
      // fail open
    }
  }

  return null;
}
