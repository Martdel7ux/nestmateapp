import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL    = Deno.env.get("SUPPORT_EMAIL") ?? "support@nestmate.app";
const FROM           = "NestMate Support <noreply@nestmate.app>";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { record } = await req.json();
  if (!record?.id) return new Response("Missing record", { status: 400 });

  const { id, subject, category, body, user_email, created_at } = record;

  const html = `
    <table style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
      <tr><td style="padding:24px 0;border-bottom:1px solid #eee">
        <h2 style="margin:0;font-size:20px">New Support Ticket</h2>
      </td></tr>
      <tr><td style="padding:16px 0">
        <p style="margin:0 0 8px"><strong>From:</strong> ${user_email ?? "anonymous"}</p>
        <p style="margin:0 0 8px"><strong>Category:</strong> ${category}</p>
        <p style="margin:0 0 8px"><strong>Subject:</strong> ${subject ?? "(none)"}</p>
        <p style="margin:0 0 16px"><strong>Received:</strong> ${new Date(created_at).toLocaleString()}</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:14px">
          ${body.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
      </td></tr>
      <tr><td style="padding:16px 0;border-top:1px solid #eee">
        <a href="https://app.nestmate.app/admin" style="color:#6366f1">Open admin panel →</a>
      </td></tr>
    </table>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `[Support] ${subject ?? `New ticket from ${user_email ?? "user"}`}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(err, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
