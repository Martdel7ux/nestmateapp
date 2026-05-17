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

// ── Bus Routes ────────────────────────────────────────────────────────────────

export type UniversityKey = 'unic' | 'ucy' | 'cut' | 'euc';

export interface BusRoute {
  id: string;
  route_code: string;
  route_name: string;
  university: UniversityKey;
  operator?: string | null;
  start_point?: string | null;
  end_point?: string | null;
  description?: string | null;
  typical_frequency?: string | null;
  first_departure?: string | null;
  last_departure?: string | null;
  fare_eur?: number | null;
  notes?: string | null;
  source_url?: string | null;
  is_active: boolean;
  display_order: number;
  updated_at: string;
  stops?: BusRouteStop[];
}

export interface BusRouteStop {
  id: string;
  route_id: string;
  stop_order: number;
  stop_name: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
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

// ── University display info ───────────────────────────────────────────────────

export const UNIVERSITY_INFO: Record<UniversityKey, {
  name: string;
  fullName: string;
  city: string;
  color: string;
  lat: number;
  lon: number;
}> = {
  unic: {
    name: 'UNIC',
    fullName: 'University of Nicosia',
    city: 'Nicosia',
    color: 'bg-blue-500',
    lat: 35.1657,
    lon: 33.3250,
  },
  ucy: {
    name: 'UCY',
    fullName: 'University of Cyprus',
    city: 'Nicosia',
    color: 'bg-violet-500',
    lat: 35.1435,
    lon: 33.4116,
  },
  cut: {
    name: 'CUT',
    fullName: 'Cyprus University of Technology',
    city: 'Limassol',
    color: 'bg-amber-500',
    lat: 34.6857,
    lon: 33.0260,
  },
  euc: {
    name: 'EUC',
    fullName: 'European University Cyprus',
    city: 'Nicosia',
    color: 'bg-emerald-500',
    lat: 35.1657,
    lon: 33.3270,
  },
};
