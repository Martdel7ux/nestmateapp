// Origin-aware CORS. The previous `Access-Control-Allow-Origin: *` let any
// website issue cross-origin requests to these functions from a browser. We now
// echo the request Origin only when it is on the allowlist.
//
// Web origins (production/preview/custom domains) are supplied via the
// ALLOWED_ORIGINS env var (comma-separated). Native Capacitor origins and local
// dev hosts are always allowed.

const STATIC_ALLOWED_ORIGINS = [
  "capacitor://localhost", // iOS WebView
  "https://localhost",     // Android (androidScheme: "https")
  "http://localhost",
  "http://localhost:5173", // Vite dev
  "http://localhost:4173", // Vite preview
];

function allowedOrigins(): string[] {
  const fromEnv = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return [...STATIC_ALLOWED_ORIGINS, ...fromEnv];
}

/** CORS headers for a specific request, echoing its Origin only if allowed. */
export function corsHeadersFor(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const list = allowedOrigins();
  const allowOrigin = list.includes(origin) ? origin : list[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

/**
 * Back-compat constant for server-to-server functions that never receive a
 * browser Origin (cron jobs, webhooks). Defaults to the first allowed origin
 * rather than a wildcard. Browser-facing functions should use
 * `corsHeadersFor(request)` instead.
 */
export const corsHeaders = corsHeadersFor(new Request("https://nestmate.invalid"));

export function handleCors(request: Request) {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersFor(request) });
  }

  return null;
}
