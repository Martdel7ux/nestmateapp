/**
 * Guard for cron-only functions that run with `verify_jwt = false` (so they are
 * otherwise publicly invocable). When the CRON_SECRET env var is set, callers
 * must present a matching `x-cron-secret` header; otherwise the request is
 * rejected. If CRON_SECRET is not set, the guard is a no-op (legacy behavior) —
 * set the secret and pass the header from your scheduler to enable protection.
 *
 * Returns a Response to reject the request, or null to allow it to proceed.
 */
export function requireCronSecret(request: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return null; // not configured → do not block existing schedules

  const provided = request.headers.get("x-cron-secret");
  if (provided && provided === expected) return null;

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
