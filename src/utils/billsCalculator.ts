import type { BillsInput, BillRange, SeasonBreakdown, BillEstimate } from "@/types/tools";

function range(min: number, max: number): BillRange { return { min, max }; }
function add(a: BillRange, b: BillRange): BillRange {
  return { min: a.min + b.min, max: a.max + b.max };
}
function scale(r: BillRange, factor: number): BillRange {
  return { min: Math.round(r.min * factor), max: Math.round(r.max * factor) };
}

export function calculateBillEstimate(input: BillsInput): BillEstimate {
  const isInland   = input.city === "nicosia";
  const isCoastal  = input.city === "limassol" || input.city === "paphos";
  const acUnits    = input.acUnits;
  const hasElecHW  = input.hotWater === "electric";

  // ── SUMMER electricity (Jun–Sep) ─────────────────────────────────────────
  const baseS       = range(40, 60);
  const perPersonS  = range(input.people * 8, input.people * 12);

  // AC: moderate = €40/unit, heavy = €70/unit; inland +15%, top floor +30%
  let acBase        = range(acUnits * 40, acUnits * 70);
  if (input.floor === "top")   acBase = scale(acBase, 1.30);
  if (input.floor === "upper") acBase = scale(acBase, 1.10);
  if (isInland)                acBase = scale(acBase, 1.15);
  if (isCoastal)               acBase = scale(acBase, 0.90);

  const hwS         = hasElecHW  ? range(25, 40) : range(0, 0);
  const dishwasherS = input.hasDishwasher     ? range(5, 10)  : range(0, 0);
  const washingS    = input.hasWashingMachine  ? range(5, 8)   : range(0, 0);

  const electricityS = [baseS, perPersonS, acBase, hwS, dishwasherS, washingS]
    .reduce(add, range(0, 0));

  // ── WINTER electricity (Nov–Mar) ─────────────────────────────────────────
  const baseW       = range(40, 60);
  const perPersonW  = range(input.people * 6, input.people * 10);

  // Reverse-cycle AC for heating: less intensive than cooling
  const heatingW    = range(acUnits * 15, acUnits * 35);
  const hwW         = hasElecHW ? range(20, 30) : range(0, 0);
  const dishwasherW = input.hasDishwasher     ? range(5, 8)  : range(0, 0);
  const washingW    = input.hasWashingMachine  ? range(5, 8)  : range(0, 0);

  const electricityW = [baseW, perPersonW, heatingW, hwW, dishwasherW, washingW]
    .reduce(add, range(0, 0));

  // ── Water ─────────────────────────────────────────────────────────────────
  const waterS = range(15, 25);
  const waterW = range(12, 20);

  // ── Internet ─────────────────────────────────────────────────────────────
  const internetS = input.internet === "included" ? range(0, 0)
    : input.internet === "unsure"    ? range(0, 35)
    : range(25, 35);
  const internetW = internetS;

  // ── Totals ────────────────────────────────────────────────────────────────
  const summer: SeasonBreakdown = {
    electricity: electricityS,
    water:       waterS,
    internet:    internetS,
    total:       [electricityS, waterS, internetS].reduce(add, range(0, 0)),
  };

  const winter: SeasonBreakdown = {
    electricity: electricityW,
    water:       waterW,
    internet:    internetW,
    total:       [electricityW, waterW, internetW].reduce(add, range(0, 0)),
  };

  // ── Tips ─────────────────────────────────────────────────────────────────
  const tips: string[] = [];

  if (acUnits > 0) {
    tips.push("Your AC will be 60–70% of your summer electricity bill. Setting it to 26°C instead of 22°C cuts that nearly in half.");
  }
  if (input.floor === "top") {
    tips.push("Top-floor flats under a flat roof absorb much more heat. Good insulation or a reflective roof coating can cut AC costs by 20–25%.");
  }
  if (input.hotWater === "electric") {
    tips.push("If your flat has a solar water heater, ask the landlord to switch — solar is standard in Cyprus and cuts electric water-heating costs to near zero in summer.");
  }
  if (isInland && acUnits > 0) {
    tips.push("Nicosia summers are significantly hotter than the coast (often 4–6°C difference). Expect higher AC costs than friends living in Limassol or Paphos.");
  }
  tips.push("EAC's peak tariff hours are generally 07:00–23:00. Running heavy appliances (washing machine, dishwasher) late at night or early morning can reduce your bill.");
  if (input.people > 1) {
    tips.push("Split the EAC bill fairly using the Household split feature in NestMate — track who paid and settle automatically.");
  }

  return { summer, winter, tips };
}
