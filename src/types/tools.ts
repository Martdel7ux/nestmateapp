// ── EAC Outages ───────────────────────────────────────────────────────────────

export type CyprusDistrict = 'nicosia' | 'limassol' | 'larnaca' | 'paphos' | 'famagusta';

export interface EacOutage {
  id: string;
  source_id?: string | null;
  starts_at: string;
  ends_at: string;
  district?: CyprusDistrict | null;
  area?: string | null;
  streets: string[];
  reason?: string | null;
  source_url?: string | null;
  raw_text?: string | null;
  scraped_at: string;
  created_at: string;
}

// ── Garbage Schedules ─────────────────────────────────────────────────────────

export interface GarbageSchedule {
  id: string;
  city: string;
  area: string;
  general_waste_days: number[];  // 0=Sun..6=Sat
  recycling_days: number[];
  organic_days: number[];
  bulky_waste_info?: string | null;
  notes?: string | null;
  source_url?: string | null;
  updated_at: string;
}

// ── Bills Calculator ──────────────────────────────────────────────────────────

export type FloorType = 'ground' | 'upper' | 'top';
export type HotWaterType = 'electric' | 'solar' | 'gas';
export type InternetStatus = 'included' | 'not_included' | 'unsure';

export interface BillsInput {
  bedrooms: 1 | 2 | 3 | 4;
  people: number;
  floor: FloorType;
  acUnits: 0 | 1 | 2 | 3;
  hotWater: HotWaterType;
  internet: InternetStatus;
  hasDishwasher: boolean;
  hasWashingMachine: boolean;
  city: 'nicosia' | 'limassol' | 'larnaca' | 'paphos';
}

export interface BillRange {
  min: number;
  max: number;
}

export interface SeasonBreakdown {
  electricity: BillRange;
  water: BillRange;
  internet: BillRange;
  total: BillRange;
}

export interface BillEstimate {
  summer: SeasonBreakdown;
  winter: SeasonBreakdown;
  tips: string[];
}

