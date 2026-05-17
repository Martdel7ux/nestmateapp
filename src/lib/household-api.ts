import { supabase } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/household-utils";
import type {
  Household, HouseholdMember, Expense, ExpenseShare,
  Settlement, HouseholdBalance, HouseholdInvite,
  ExpenseFormData, SettlementFormData, SplitMethod,
} from "@/types/household";
import {
  calcEqualShares, calcSharesShares,
  eurosToCents, centsToEuros,
} from "@/lib/household-utils";

function sb() {
  if (!supabase) throw new Error("Supabase not initialized");
  return supabase;
}

// ── Households ────────────────────────────────────────────────────────────────

export async function fetchUserHouseholds(userId: string): Promise<Household[]> {
  const { data, error } = await sb()
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", userId)
    .is("left_at", null);
  if (error) throw error;
  return ((data ?? []).map((r: { household: unknown }) => r.household).filter(Boolean)) as Household[];
}

export async function fetchHousehold(id: string): Promise<Household | null> {
  const { data, error } = await sb()
    .from("households")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Household | null;
}

export async function createHousehold(params: {
  name: string;
  address?: string;
  currency?: string;
  userId: string;
}): Promise<Household> {
  const inviteCode = generateInviteCode();
  const expires = new Date(Date.now() + 14 * 86400_000).toISOString();
  const { data, error } = await sb().rpc("create_household_for_user", {
    p_name:           params.name,
    p_address:        params.address || null,
    p_currency:       params.currency || "EUR",
    p_invite_code:    inviteCode,
    p_invite_expires: expires,
  });
  if (error) throw error;
  return data as Household;
}

export async function updateHousehold(
  id: string,
  patch: Partial<Pick<Household, "name" | "address" | "currency">>
): Promise<Household> {
  const { data, error } = await sb()
    .from("households")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Household;
}

export async function regenerateInviteCode(id: string): Promise<string> {
  const code = generateInviteCode();
  const { error } = await sb()
    .from("households")
    .update({
      invite_code: code,
      invite_expires_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  return code;
}

export async function joinHouseholdByCode(
  code: string,
  userId: string
): Promise<Household> {
  const { data: hh, error: hhErr } = await sb()
    .from("households")
    .select("*")
    .eq("invite_code", code.toUpperCase().trim())
    .maybeSingle();
  if (hhErr) throw hhErr;
  if (!hh) throw new Error("Invalid invite code — no household found.");

  const expires = hh.invite_expires_at ? new Date(hh.invite_expires_at) : null;
  if (expires && expires < new Date()) throw new Error("This invite code has expired.");

  // Check already a member
  const { data: existing } = await sb()
    .from("household_members")
    .select("user_id")
    .eq("household_id", hh.id)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();
  if (existing) throw new Error("You're already a member of this household.");

  const { error: joinErr } = await sb()
    .from("household_members")
    .insert({ household_id: hh.id, user_id: userId, role: "member" });
  if (joinErr) {
    if (joinErr.message.includes("household_full"))
      throw new Error("This household is full (max 6 members).");
    throw joinErr;
  }
  return hh as Household;
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function fetchHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data, error } = await sb()
    .from("household_members")
    .select(`
      household_id, user_id, role, display_name, joined_at, left_at,
      profiles:user_id ( full_name, avatar_url )
    `)
    .eq("household_id", householdId)
    .is("left_at", null);
  if (error) throw error;

  return ((data ?? []) as unknown[]).map((r: unknown) => {
    const row = r as {
      household_id: string; user_id: string; role: string;
      display_name: string | null; joined_at: string; left_at: string | null;
      profiles: { full_name: string | null; avatar_url: string | null } | null;
    };
    return {
      household_id: row.household_id,
      user_id:      row.user_id,
      role:         row.role as HouseholdMember["role"],
      display_name: row.display_name,
      joined_at:    row.joined_at,
      left_at:      row.left_at,
      full_name:    row.profiles?.full_name ?? null,
      avatar_url:   row.profiles?.avatar_url ?? null,
    };
  });
}

export async function leaveHousehold(householdId: string, userId: string): Promise<void> {
  const { error } = await sb()
    .from("household_members")
    .update({ left_at: new Date().toISOString() })
    .eq("household_id", householdId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function removeMember(householdId: string, userId: string): Promise<void> {
  const { error } = await sb()
    .from("household_members")
    .update({ left_at: new Date().toISOString() })
    .eq("household_id", householdId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function fetchExpenses(
  householdId: string,
  limit = 50
): Promise<Expense[]> {
  const { data, error } = await sb()
    .from("expenses")
    .select(`
      *,
      shares:expense_shares(*),
      payer:paid_by(full_name, avatar_url)
    `)
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("paid_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as Expense[];
}

export async function fetchExpense(id: string): Promise<Expense | null> {
  const { data, error } = await sb()
    .from("expenses")
    .select(`*, shares:expense_shares(*), payer:paid_by(full_name, avatar_url)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Expense | null;
}

export async function addExpense(
  form: ExpenseFormData,
  householdId: string,
  userId: string
): Promise<Expense> {
  const totalCents = eurosToCents(parseFloat(form.amount) || 0);
  const totalEuros = centsToEuros(totalCents);

  // Compute shares
  let sharesCents: Record<string, number>;
  if (form.split_method === "equal") {
    sharesCents = calcEqualShares(totalCents, form.participant_ids);
  } else if (form.split_method === "shares") {
    const weights: Record<string, number> = {};
    form.participant_ids.forEach((id) => {
      weights[id] = parseFloat(form.share_weights?.[id] ?? "1") || 1;
    });
    sharesCents = calcSharesShares(totalCents, weights);
  } else {
    // custom
    const customCents: Record<string, number> = {};
    form.participant_ids.forEach((id) => {
      customCents[id] = eurosToCents(parseFloat(form.custom_shares?.[id] ?? "0") || 0);
    });
    sharesCents = customCents;
  }

  // Insert expense
  const { data: expense, error: expErr } = await sb()
    .from("expenses")
    .insert({
      household_id: householdId,
      description:  form.description,
      amount:       totalEuros,
      category:     form.category || null,
      paid_by:      form.paid_by,
      paid_at:      form.paid_at,
      split_method: form.split_method as SplitMethod,
      notes:        form.notes || null,
      created_by:   userId,
    })
    .select()
    .single();
  if (expErr) throw expErr;

  // Insert shares
  const sharesRows = Object.entries(sharesCents).map(([uid, cents]) => ({
    expense_id: expense.id,
    user_id:    uid,
    amount:     centsToEuros(cents),
    share_weight: form.split_method === "shares"
      ? (parseFloat(form.share_weights?.[uid] ?? "1") || 1)
      : null,
  }));
  if (sharesRows.length > 0) {
    const { error: sharesErr } = await sb().from("expense_shares").insert(sharesRows);
    if (sharesErr) throw sharesErr;
  }

  return expense as Expense;
}

export async function softDeleteExpense(id: string): Promise<void> {
  const { error } = await sb()
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ── Settlements ───────────────────────────────────────────────────────────────

export async function fetchSettlements(householdId: string): Promise<Settlement[]> {
  const { data, error } = await sb()
    .from("settlements")
    .select("*")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("settled_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Settlement[];
}

export async function addSettlement(
  form: SettlementFormData,
  householdId: string,
  userId: string
): Promise<Settlement> {
  const { data, error } = await sb()
    .from("settlements")
    .insert({
      household_id: householdId,
      from_user_id: form.from_user_id,
      to_user_id:   form.to_user_id,
      amount:       parseFloat(form.amount),
      method:       form.method || null,
      note:         form.note || null,
      settled_at:   form.settled_at,
      created_by:   userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Settlement;
}

// ── Balances ──────────────────────────────────────────────────────────────────

export async function fetchHouseholdBalances(
  householdId: string
): Promise<HouseholdBalance[]> {
  const { data, error } = await sb()
    .from("household_balances")
    .select("*")
    .eq("household_id", householdId);
  if (error) throw error;
  return (data ?? []) as HouseholdBalance[];
}

// ── Invites ───────────────────────────────────────────────────────────────────

export async function fetchHouseholdInvites(
  householdId: string
): Promise<HouseholdInvite[]> {
  const { data, error } = await sb()
    .from("household_invites")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "pending");
  if (error) throw error;
  return (data ?? []) as HouseholdInvite[];
}
