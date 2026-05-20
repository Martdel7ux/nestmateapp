// ── GTFS data types ───────────────────────────────────────────────────────────

export interface GtfsRoute {
  route_id:         string;
  agency_id?:       string | null;
  route_short_name?: string | null;
  route_long_name?:  string | null;
  route_desc?:       string | null;
  route_type:        number;
  route_color?:      string | null;  // hex WITHOUT leading #
  route_text_color?: string | null;
}

export interface GtfsStop {
  stop_id:    string;
  stop_code?: string | null;
  stop_name:  string;
  stop_desc?: string | null;
  stop_lat:   number;
  stop_lon:   number;
  zone_id?:   string | null;
}

export interface GtfsStopWithSeq extends GtfsStop {
  stop_sequence: number;
}

export interface GtfsShapePoint {
  lat: number;
  lon: number;
  seq: number;
}

export interface RouteDirection {
  direction_id:  number;
  trip_headsign: string | null;
}

export interface RouteAtStop {
  route_id:         string;
  route_short_name: string;
  route_long_name:  string;
  route_color:      string;
  route_text_color: string;
}

export interface NextArrival {
  route_id:         string;
  route_short_name: string;
  route_long_name:  string;
  route_color:      string;  // hex WITHOUT leading #
  route_text_color: string;
  trip_headsign:    string | null;
  arrival_time:     string;  // "HH:MM:SS"
  minutes_until:    number;
}

export interface UserBusFavorite {
  id:         string;
  user_id:    string;
  stop_id:    string;
  created_at: string;
}

export interface TripOption {
  route_id:                  string;
  route_short_name:          string;
  route_long_name:           string;
  route_color:               string;  // hex WITHOUT #
  route_text_color:          string;
  from_stop_id:              string;
  from_stop_name:            string;
  from_stop_lat:             number;
  from_stop_lon:             number;
  from_stop_distance_meters: number;
  to_stop_id:                string;
  to_stop_name:              string;
  to_stop_lat:               number;
  to_stop_lon:               number;
  to_stop_distance_meters:   number;
  departure_time:            string;  // ISO timestamptz
  arrival_time:              string;
  trip_duration_minutes:     number;
  stop_count:                number;
}

export interface GtfsStats {
  routes:         number;
  stops:          number;
  trips:          number;
  stop_times:     number;
  shape_points:   number;
  calendar_dates: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ensures a GTFS colour string starts with # for use as a CSS colour value. */
export function routeBgColor(hex: string | null | undefined): string {
  if (!hex) return '#3b82f6';
  return hex.startsWith('#') ? hex : `#${hex}`;
}

export function routeTextColor(hex: string | null | undefined): string {
  if (!hex) return '#ffffff';
  return hex.startsWith('#') ? hex : `#${hex}`;
}

/** Format minutes_until into a human-readable string. */
export function formatMinutesUntil(minutes: number): string {
  if (minutes <= 0)  return 'Now';
  if (minutes < 60)  return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}
