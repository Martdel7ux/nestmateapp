import type { DocumentCategory } from "@/types/document";

const rules: Array<{ patterns: RegExp[]; category: DocumentCategory }> = [
  { patterns: [/lease|tenancy|rental.?agr/i], category: "lease" },
  { patterns: [/deposit/i],                   category: "deposit_receipt" },
  { patterns: [/utility|electric|water|gas|internet|broadband/i], category: "utility_bill" },
  { patterns: [/rent.?receipt|receipt.?rent/i], category: "rent_receipt" },
  { patterns: [/insur/i],                     category: "insurance" },
  { patterns: [/university.?id|student.?id|uni.?card/i], category: "university_id" },
  { patterns: [/residence.?permit|yellow.?slip|mec/i], category: "residence_permit" },
  { patterns: [/\bvisa\b/i],                  category: "visa" },
  { patterns: [/passport/i],                  category: "passport" },
  { patterns: [/bank.?stat|statement/i],      category: "bank_statement" },
  { patterns: [/medical|doctor|hospital|prescription/i], category: "medical" },
  { patterns: [/tax|irs|vat|income/i],        category: "tax" },
];

export function detectCategory(filename: string): DocumentCategory {
  const name = filename.toLowerCase();
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(name))) return rule.category;
  }
  return "other";
}
