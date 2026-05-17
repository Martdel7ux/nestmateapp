import type { HouseholdMember, SettleSuggestion } from "@/types/household";

// ── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ── Split calculator (works in integer cents to avoid float errors) ───────────

/** Equal split — distribute remainder cents to first N participants */
export function calcEqualShares(
  totalCents: number,
  participantIds: string[]
): Record<string, number> {
  const n = participantIds.length;
  if (n === 0) return {};
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const result: Record<string, number> = {};
  participantIds.forEach((id, i) => {
    result[id] = base + (i < remainder ? 1 : 0);
  });
  return result;
}

/** Shares split — weighted proportional split */
export function calcSharesShares(
  totalCents: number,
  weights: Record<string, number>
): Record<string, number> {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return {};
  const ids = Object.keys(weights).sort((a, b) => weights[b] - weights[a]);
  const result: Record<string, number> = {};
  let allocated = 0;
  ids.forEach((id, i) => {
    if (i === ids.length - 1) {
      result[id] = totalCents - allocated;
    } else {
      const share = Math.round((weights[id] / totalWeight) * totalCents);
      result[id] = share;
      allocated += share;
    }
  });
  return result;
}

/** Convert euro amounts -> cents, validate sum matches total, return cents map */
export function validateCustomShares(
  totalCents: number,
  customAmounts: Record<string, number>
): { valid: boolean; diff: number } {
  const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0);
  return { valid: sum === totalCents, diff: totalCents - sum };
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): number {
  return cents / 100;
}

// ── Settle algorithm (minimum-transaction greedy) ─────────────────────────────

/**
 * Given a net balance map (user_id -> balance in euros, positive = owed money),
 * produce the minimum set of transactions to settle all debts.
 */
export function computeSettleSuggestions(
  balances: Record<string, number>
): SettleSuggestion[] {
  // Work in cents
  const creditors: { id: string; amount: number }[] = [];
  const debtors:   { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    const cents = Math.round(balance * 100);
    if (cents > 0) creditors.push({ id, amount: cents });
    if (cents < 0) debtors.push({ id, amount: -cents });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const suggestions: SettleSuggestion[] = [];

  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt   = debtors[di];
    const settle = Math.min(credit.amount, debt.amount);
    if (settle > 0) {
      suggestions.push({
        from_user_id: debt.id,
        to_user_id:   credit.id,
        amount:       centsToEuros(settle),
      });
    }
    credit.amount -= settle;
    debt.amount   -= settle;
    if (credit.amount === 0) ci++;
    if (debt.amount === 0)   di++;
  }

  return suggestions;
}

// ── Invite code generator ─────────────────────────────────────────────────────

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NEST-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Member display helpers ────────────────────────────────────────────────────

export function getMemberName(member: HouseholdMember): string {
  return member.display_name || member.full_name || "Unknown";
}

export function getMemberInitials(member: HouseholdMember): string {
  const name = getMemberName(member);
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const CATEGORY_LABELS: Record<string, string> = {
  utilities:  "Utilities",
  groceries:  "Groceries",
  rent:       "Rent",
  internet:   "Internet",
  cleaning:   "Cleaning",
  other:      "Other",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  utilities:  "⚡",
  groceries:  "🛒",
  rent:       "🏠",
  internet:   "📶",
  cleaning:   "🧹",
  other:      "💸",
};
