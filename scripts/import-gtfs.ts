/**
 * GTFS Import Script — Nicosia Transit
 *
 * Reads 9_google_transit.zip and populates the Supabase GTFS tables.
 * Run AFTER applying the 20260520000001_gtfs_bus_transit migration.
 *
 * Usage (PowerShell):
 *   $env:VITE_SUPABASE_URL = "https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
 *   npx tsx scripts/import-gtfs.ts
 *
 * Install deps first (one time):
 *   npm install --save-dev adm-zip papaparse @types/adm-zip @types/papaparse
 */

import AdmZip from 'adm-zip';
import Papa  from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────

const GTFS_ZIP  = 'C:/Users/User/Downloads/9_google_transit.zip';
const SUPABASE_URL       = process.env.VITE_SUPABASE_URL       ?? '';
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing env vars. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCSV(zip: AdmZip, filename: string): Record<string, string>[] {
  const entry = zip.getEntry(filename);
  if (!entry) {
    console.warn(`  ⚠  ${filename} not found in zip — skipping`);
    return [];
  }
  const csv = entry.getData().toString('utf8');
  const result = Papa.parse<Record<string, string>>(csv, {
    header:         true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^﻿/, '').trim(), // strip BOM
  });
  if (result.errors.length > 0) {
    console.warn(`  ⚠  Parse warnings in ${filename}:`, result.errors.slice(0, 2));
  }
  return result.data;
}

async function batchUpsert(
  table:      string,
  rows:       object[],
  onConflict: string,
  batchSize   = 2000,
) {
  let done = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      process.stdout.write('\n');
      console.error(`  ✗  ${table} batch error:`, error.message);
      throw error;
    }
    done += batch.length;
    process.stdout.write(`\r  ${done.toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
  process.stdout.write('\n');
}

function gtfsDate(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📦  Opening GTFS zip:', GTFS_ZIP);
  const zip = new AdmZip(GTFS_ZIP);

  // 1. Routes
  console.log('\n🚍  Importing routes...');
  const routes = parseCSV(zip, 'routes.txt');
  await batchUpsert('bus_routes', routes.map(r => ({
    route_id:         r.route_id,
    agency_id:        r.agency_id        || null,
    route_short_name: r.route_short_name || null,
    route_long_name:  r.route_long_name  || null,
    route_desc:       r.route_desc       || null,
    route_type:       parseInt(r.route_type, 10) || 3,
    route_color:      r.route_color      || '3b82f6',
    route_text_color: r.route_text_color || 'ffffff',
  })), 'route_id');
  console.log(`  ✅  ${routes.length} routes`);

  // 2. Stops
  console.log('\n📍  Importing stops...');
  const stops = parseCSV(zip, 'stops.txt');
  await batchUpsert('bus_stops', stops.map(s => ({
    stop_id:   s.stop_id,
    stop_code: s.stop_code || null,
    stop_name: s.stop_name,
    stop_desc: s.stop_desc || null,
    stop_lat:  parseFloat(s.stop_lat),
    stop_lon:  parseFloat(s.stop_lon),
    zone_id:   s.zone_id   || null,
  })), 'stop_id');
  console.log(`  ✅  ${stops.length} stops`);

  // 3. Trips (must come before stop_times — FK to bus_routes)
  console.log('\n🚌  Importing trips...');
  const trips = parseCSV(zip, 'trips.txt');
  await batchUpsert('bus_trips', trips.map(t => ({
    trip_id:       t.trip_id,
    route_id:      t.route_id,
    service_id:    t.service_id,
    trip_headsign: t.trip_headsign || null,
    direction_id:  t.direction_id !== '' ? parseInt(t.direction_id, 10) : null,
    shape_id:      t.shape_id      || null,
  })), 'trip_id');
  console.log(`  ✅  ${trips.length} trips`);

  // 4. Stop Times (largest file — ~338 k rows)
  console.log('\n⏱   Importing stop times (may take 1–3 min)...');
  const stopTimes = parseCSV(zip, 'stop_times.txt');
  await batchUpsert('bus_stop_times', stopTimes.map(st => ({
    trip_id:        st.trip_id,
    stop_id:        st.stop_id,
    arrival_time:   st.arrival_time,
    departure_time: st.departure_time,
    stop_sequence:  parseInt(st.stop_sequence, 10),
    pickup_type:    st.pickup_type   ? parseInt(st.pickup_type,   10) : 0,
    drop_off_type:  st.drop_off_type ? parseInt(st.drop_off_type, 10) : 0,
  })), 'trip_id,stop_sequence', 3000);
  console.log(`  ✅  ${stopTimes.length} stop times`);

  // 5. Calendar dates
  console.log('\n📅  Importing calendar dates...');
  const calDates = parseCSV(zip, 'calendar_dates.txt');
  await batchUpsert('bus_calendar_dates', calDates.map(c => ({
    service_id:     c.service_id,
    date:           gtfsDate(c.date),
    exception_type: parseInt(c.exception_type, 10),
  })), 'service_id,date');
  console.log(`  ✅  ${calDates.length} calendar dates`);

  // 6. Shapes (polyline points — ~97 k rows)
  console.log('\n🗺   Importing shape points...');
  const shapes = parseCSV(zip, 'shapes.txt');
  await batchUpsert('bus_shapes', shapes.map(s => ({
    shape_id:          s.shape_id,
    shape_pt_lat:      parseFloat(s.shape_pt_lat),
    shape_pt_lon:      parseFloat(s.shape_pt_lon),
    shape_pt_sequence: parseInt(s.shape_pt_sequence, 10),
  })), 'shape_id,shape_pt_sequence', 3000);
  console.log(`  ✅  ${shapes.length} shape points`);

  console.log('\n🎉  Import complete!\n');
  console.log('Expected counts:');
  console.log('  bus_routes         ~194');
  console.log('  bus_stops         ~1 784');
  console.log('  bus_trips         ~many');
  console.log('  bus_stop_times   ~428 k');
  console.log('  bus_shapes        ~97 k');
  console.log('  bus_calendar_dates ~small\n');
}

main().catch(err => {
  console.error('\n✗  Import failed:', err);
  process.exit(1);
});
