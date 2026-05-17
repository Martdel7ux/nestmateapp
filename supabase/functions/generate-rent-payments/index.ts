import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Return the actual calendar date for a given due_day in a given year/month,
 *  clamping to the last day of that month (handles Feb, 30-day months, etc.) */
function dueDateFor(year: number, month: number, dueDay: number): Date {
  const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
  const day = Math.min(dueDay, lastDay);
  return new Date(year, month - 1, day);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lookahead = new Date(today);
    lookahead.setDate(today.getDate() + 90);

    // Fetch all active agreements
    const { data: agreements, error: agErr } = await supabase
      .from("rent_agreements")
      .select("id, due_day, first_payment_date, end_date, amount, currency")
      .eq("is_active", true);

    if (agErr) throw agErr;
    if (!agreements || agreements.length === 0) {
      return new Response(JSON.stringify({ created: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;

    for (const ag of agreements) {
      const firstDate = new Date(ag.first_payment_date);
      const endDate   = ag.end_date ? new Date(ag.end_date) : null;

      // Walk through each month in the 90-day window
      const cursor = new Date(today);
      cursor.setDate(1); // start of current month

      while (cursor <= lookahead) {
        const year  = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const due   = dueDateFor(year, month, ag.due_day);

        // Skip if before first payment or after end date or outside window
        if (due >= firstDate && due <= lookahead && (!endDate || due <= endDate)) {
          const dueDateStr = due.toISOString().slice(0, 10);

          // Upsert — do nothing if row already exists
          const { error: upsertErr } = await supabase
            .from("rent_payments")
            .upsert(
              {
                agreement_id: ag.id,
                due_date:     dueDateStr,
                amount:       ag.amount,
                currency:     ag.currency,
                status:       "upcoming",
              },
              { onConflict: "agreement_id,due_date", ignoreDuplicates: true }
            );

          if (upsertErr) {
            console.error(`[generate-rent-payments] upsert error for ${ag.id} ${dueDateStr}:`, upsertErr.message);
          } else {
            created++;
          }
        }

        // Advance to next month
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    // Deactivate agreements past their end date
    const todayStr = today.toISOString().slice(0, 10);
    await supabase
      .from("rent_agreements")
      .update({ is_active: false })
      .lt("end_date", todayStr)
      .eq("is_active", true);

    console.log(`[generate-rent-payments] created/checked=${created} agreements=${agreements.length}`);

    return new Response(JSON.stringify({ created, agreements: agreements.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-rent-payments] unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
