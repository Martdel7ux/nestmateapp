import { supabase } from "@/lib/supabase";
import type {
  RentAgreement, RentPayment, RentAgreementFormData, MarkPaidFormData,
} from "@/types/rent";
import { addExpense } from "@/lib/household-api";
import { fetchHouseholdMembers } from "@/lib/household-api";

function sb() {
  if (!supabase) throw new Error("Supabase not initialized");
  return supabase;
}

// ── Agreements ────────────────────────────────────────────────────────────────

export async function fetchRentAgreements(userId: string): Promise<RentAgreement[]> {
  const { data, error } = await sb()
    .from("rent_agreements")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RentAgreement[];
}

export async function fetchRentAgreement(id: string): Promise<RentAgreement | null> {
  const { data, error } = await sb()
    .from("rent_agreements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as RentAgreement | null;
}

export async function createRentAgreement(
  form: RentAgreementFormData,
  userId: string
): Promise<RentAgreement> {
  const { data, error } = await sb()
    .from("rent_agreements")
    .insert({
      user_id:                     userId,
      household_id:                form.scope === "household" ? (form.household_id ?? null) : null,
      amount:                      parseFloat(form.amount),
      currency:                    form.currency,
      due_day:                     parseInt(form.due_day),
      first_payment_date:          form.first_payment_date,
      end_date:                    form.open_ended ? null : (form.end_date || null),
      scope:                       form.scope,
      landlord_name:               form.landlord_name || null,
      landlord_phone:              form.landlord_phone || null,
      landlord_email:              form.landlord_email || null,
      landlord_whatsapp:           form.landlord_whatsapp || null,
      payment_method:              form.payment_method || null,
      payment_details:             form.payment_details || null,
      reminder_days_before:        form.reminder_days_before,
      reminder_followup_on_due_day: form.reminder_followup_on_due_day,
      reminder_channels:           form.reminder_channels,
    })
    .select()
    .single();
  if (error) throw error;
  return data as RentAgreement;
}

export async function updateRentAgreement(
  id: string,
  patch: Partial<RentAgreementFormData>
): Promise<RentAgreement> {
  const update: Record<string, unknown> = {};
  if (patch.amount)           update.amount = parseFloat(patch.amount);
  if (patch.due_day)          update.due_day = parseInt(patch.due_day);
  if (patch.first_payment_date) update.first_payment_date = patch.first_payment_date;
  if ("open_ended" in patch)  update.end_date = patch.open_ended ? null : (patch.end_date || null);
  if (patch.landlord_name !== undefined) update.landlord_name = patch.landlord_name || null;
  if (patch.landlord_phone !== undefined) update.landlord_phone = patch.landlord_phone || null;
  if (patch.landlord_email !== undefined) update.landlord_email = patch.landlord_email || null;
  if (patch.landlord_whatsapp !== undefined) update.landlord_whatsapp = patch.landlord_whatsapp || null;
  if (patch.payment_method)   update.payment_method = patch.payment_method;
  if (patch.payment_details !== undefined) update.payment_details = patch.payment_details || null;
  if (patch.reminder_days_before !== undefined) update.reminder_days_before = patch.reminder_days_before;
  if (patch.reminder_followup_on_due_day !== undefined) update.reminder_followup_on_due_day = patch.reminder_followup_on_due_day;
  if (patch.reminder_channels) update.reminder_channels = patch.reminder_channels;

  const { data, error } = await sb()
    .from("rent_agreements")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as RentAgreement;
}

export async function deactivateRentAgreement(id: string): Promise<void> {
  const { error } = await sb()
    .from("rent_agreements")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function fetchRentPayments(
  agreementId: string,
  limit = 24
): Promise<RentPayment[]> {
  const { data, error } = await sb()
    .from("rent_payments")
    .select("*")
    .eq("agreement_id", agreementId)
    .order("due_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RentPayment[];
}

export async function fetchRentPayment(id: string): Promise<RentPayment | null> {
  const { data, error } = await sb()
    .from("rent_payments")
    .select(`
      *,
      rent_agreements (
        landlord_name, landlord_phone, landlord_email,
        landlord_whatsapp, payment_method, payment_details,
        household_id, scope, user_id
      )
    `)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as RentPayment | null;
}

export async function fetchUpcomingRentPayment(userId: string): Promise<RentPayment | null> {
  // Get the soonest non-paid payment across all user's active agreements
  const { data: agreements } = await sb()
    .from("rent_agreements")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!agreements || agreements.length === 0) return null;
  const ids = agreements.map((a: { id: string }) => a.id);

  const { data, error } = await sb()
    .from("rent_payments")
    .select("*")
    .in("agreement_id", ids)
    .in("status", ["upcoming", "reminded", "due_today", "late"])
    .order("due_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as RentPayment | null;
}

export async function markRentPaid(
  payment: RentPayment,
  form: MarkPaidFormData,
  userId: string
): Promise<void> {
  const { error } = await sb()
    .from("rent_payments")
    .update({
      status:     "paid",
      paid_at:    form.paid_at ? new Date(form.paid_at).toISOString() : new Date().toISOString(),
      paid_method: form.paid_method || null,
      notes:      form.notes || null,
    })
    .eq("id", payment.id);
  if (error) throw error;

  // If scope=household, create a household expense
  const ag = payment.rent_agreements;
  if (ag?.scope === "household" && ag.household_id) {
    try {
      const members = await fetchHouseholdMembers(ag.household_id);
      const dueDate = new Date(payment.due_date);
      const monthName = dueDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

      await addExpense(
        {
          description:     `Rent – ${monthName}`,
          amount:          String(payment.amount),
          paid_by:         userId,
          paid_at:         payment.due_date,
          split_method:    "equal",
          category:        "rent",
          participant_ids: members.map((m) => m.user_id),
        },
        ag.household_id,
        userId
      );
    } catch (expErr) {
      console.error("Failed to create household expense for rent:", expErr);
      // Non-fatal — payment is still marked paid
    }
  }
}

// ── Push subscriptions ────────────────────────────────────────────────────────

export async function savePushSubscription(
  userId: string,
  sub: PushSubscription
): Promise<void> {
  const json = sub.toJSON();
  const { error } = await sb()
    .from("push_subscriptions")
    .upsert({
      user_id:  userId,
      endpoint: sub.endpoint,
      p256dh:   json.keys?.p256dh ?? "",
      auth:     json.keys?.auth ?? "",
      user_agent: navigator.userAgent.slice(0, 200),
    }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
}

export async function deletePushSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  const { error } = await sb()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) throw error;
}
