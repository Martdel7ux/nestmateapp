// Student email verification via an emailed one-time code.
//
//   POST { action: "send",   email }  → validates the university domain,
//                                        stores a hashed 6-digit code, emails it.
//   POST { action: "verify", code  }  → checks the code, and on success sets
//                                        profiles.student_verified_at + the
//                                        owner-only profiles_private.student_email.
//
// Env required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//               RESEND_API_KEY. Optional: STUDENT_EMAIL_PEPPER.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, corsHeadersFor } from "../_shared/cors.ts";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 45;

// Official Cyprus university email domains.
const UNIVERSITY_DOMAINS: Record<string, string> = {
  "ucy.ac.cy": "University of Cyprus",
  "cut.ac.cy": "Cyprus University of Technology",
  "unic.ac.cy": "University of Nicosia",
  "euc.ac.cy": "European University Cyprus",
  "frederick.ac.cy": "Frederick University",
  "uclancyprus.ac.cy": "UCLan Cyprus",
  "nup.ac.cy": "Neapolis University Pafos",
  "ouc.ac.cy": "Open University of Cyprus",
};

function recognizeUniversity(email: string): { ok: boolean; university?: string } {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false };
  const domain = clean.split("@")[1] ?? "";
  for (const [d, name] of Object.entries(UNIVERSITY_DOMAINS)) {
    if (domain === d || domain.endsWith("." + d)) return { ok: true, university: name };
  }
  if (/(^|\.)ac\.cy$/.test(domain) || /(^|\.)edu$/.test(domain) || /(^|\.)ac\.uk$/.test(domain) || /(^|\.)edu\.[a-z]{2,}$/.test(domain)) {
    return { ok: true };
  }
  return { ok: false };
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hashCode(code: string, userId: string): Promise<string> {
  const pepper = Deno.env.get("STUDENT_EMAIL_PEPPER") ?? "";
  return sha256(`${code}:${userId}:${pepper}`);
}

async function sendCodeEmail(to: string, code: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.error("RESEND_API_KEY missing"); return false; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: "NestMate <verify@nestmate.app>",
      to,
      subject: `${code} is your NestMate verification code`,
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;"><tr><td align="center">
    <table width="100%" style="max-width:480px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#38bdf8);padding:32px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">🏠 NestMate</h1></td></tr>
      <tr><td style="padding:32px;text-align:center;">
        <h2 style="margin:0 0 8px;color:#111827;font-size:19px;">Verify your student email</h2>
        <p style="margin:0 0 22px;color:#4b5563;font-size:14px;line-height:1.6;">Enter this code in the app to earn your verified-student badge. It expires in ${CODE_TTL_MIN} minutes.</p>
        <div style="display:inline-block;background:#eef0fe;color:#4F46E5;font-size:30px;font-weight:800;letter-spacing:8px;padding:14px 24px;border-radius:14px;">${code}</div>
        <p style="margin:22px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">If you didn't request this, you can ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    }),
  });
  if (!res.ok) { console.error("Resend error:", await res.text()); return false; }
  return true;
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

  // Identify the caller from their JWT.
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
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  // ── Send a code ───────────────────────────────────────────────────────────
  if (action === "send") {
    const email = String(body?.email ?? "");
    const rec = recognizeUniversity(email);
    if (!rec.ok) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_domain" }), { status: 200, headers });
    }

    // Simple resend throttle.
    const { data: existing } = await admin
      .from("student_email_verifications")
      .select("updated_at, verified_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.updated_at && !existing.verified_at) {
      const since = (Date.now() - new Date(existing.updated_at).getTime()) / 1000;
      if (since < RESEND_SECONDS) {
        return new Response(JSON.stringify({ ok: false, reason: "rate_limited", retryIn: Math.ceil(RESEND_SECONDS - since) }), { status: 200, headers });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await hashCode(code, user.id);
    const now = new Date();
    const expires_at = new Date(now.getTime() + CODE_TTL_MIN * 60_000).toISOString();

    const { error: upErr } = await admin.from("student_email_verifications").upsert({
      user_id: user.id, email: email.trim().toLowerCase(), university: rec.university ?? null,
      code_hash, expires_at, attempts: 0, verified_at: null, updated_at: now.toISOString(),
    });
    if (upErr) {
      console.error("upsert failed:", upErr.message);
      return new Response(JSON.stringify({ error: "Could not start verification" }), { status: 500, headers });
    }

    const sent = await sendCodeEmail(email.trim(), code);
    if (!sent) {
      return new Response(JSON.stringify({ error: "Could not send the email" }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ ok: true, university: rec.university ?? null }), { status: 200, headers });
  }

  // ── Verify a code ─────────────────────────────────────────────────────────
  if (action === "verify") {
    const code = String(body?.code ?? "").trim();
    const { data: row } = await admin
      .from("student_email_verifications")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!row) return new Response(JSON.stringify({ ok: false, reason: "no_pending" }), { status: 200, headers });
    if (row.verified_at) return new Response(JSON.stringify({ ok: true, university: row.university }), { status: 200, headers });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ ok: false, reason: "expired" }), { status: 200, headers });
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ ok: false, reason: "too_many_attempts" }), { status: 200, headers });
    }

    const expected = row.code_hash;
    const got = await hashCode(code, user.id);
    if (got !== expected) {
      await admin.from("student_email_verifications").update({ attempts: row.attempts + 1, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      return new Response(JSON.stringify({ ok: false, reason: "incorrect", remaining: MAX_ATTEMPTS - row.attempts - 1 }), { status: 200, headers });
    }

    // Success: mark verified + publish the badge and the owner-only email.
    const nowIso = new Date().toISOString();
    await admin.from("student_email_verifications").update({ verified_at: nowIso, updated_at: nowIso }).eq("user_id", user.id);
    await admin.from("profiles").update({ student_verified_at: nowIso }).eq("id", user.id);
    await admin.from("profiles_private").upsert({ id: user.id, student_email: row.email });

    return new Response(JSON.stringify({ ok: true, university: row.university, email: row.email }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers });
});
