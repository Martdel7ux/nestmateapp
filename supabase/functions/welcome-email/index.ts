import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    const body = await req.json();

    // Supabase auth webhook payload
    const user = body?.record ?? body?.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "No email found" }), { status: 400 });
    }

    const name = user.user_metadata?.full_name ?? user.email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NestMate <welcome@nestmate.app>",
        to: user.email,
        subject: "Welcome to NestMate! 🏠",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#38bdf8);padding:40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🏠 NestMate</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Find your perfect flatmate</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:22px;font-weight:700;">Welcome, ${name}! 👋</h2>
              <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7;">
                We're excited to have you on NestMate — the easiest way to find a compatible flatmate or a great place to live in Cyprus.
              </p>
              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7;">
                Here's what you can do:
              </p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
                <tr>
                  <td style="padding:12px 16px;background:#f9fafb;border-radius:12px;margin-bottom:10px;">
                    <span style="font-size:20px;">🔍</span>
                    <span style="display:inline-block;margin-left:10px;color:#111827;font-size:14px;font-weight:600;">Browse flatmate profiles and swipe to match</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f9fafb;border-radius:12px;">
                    <span style="font-size:20px;">💬</span>
                    <span style="display:inline-block;margin-left:10px;color:#111827;font-size:14px;font-weight:600;">Chat with your matches to find the perfect fit</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#f9fafb;border-radius:12px;">
                    <span style="font-size:20px;">🏠</span>
                    <span style="display:inline-block;margin-left:10px;color:#111827;font-size:14px;font-weight:600;">List your flat or create a flatmate profile</span>
                  </td>
                </tr>
              </table>
              <div style="text-align:center;margin-bottom:8px;">
                <a href="https://nestmate.app" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#38bdf8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;">Open NestMate</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You're receiving this because you signed up at nestmate.app.<br/>
                © 2025 NestMate. Cyprus.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
