-- ============================================================================
-- GTFS Bus Transit Upgrade
-- Drops the old curated bus_routes / bus_route_stops tables and replaces them
-- with a full GTFS-native schema covering 194 Nicosia routes + 1,784 stops.
-- ============================================================================

-- Drop old tables (cascade removes RLS policies and FK constraints)
drop table if exists public.bus_route_stops cascade;
drop table if exists public.bus_routes     cascade;

-- ── Routes ───────────────────────────────────────────────────────────────────
create table public.bus_routes (
  route_id         text primary key,
  agency_id        text,
  route_short_name text,
  route_long_name  text,
  route_desc       text,
  route_type       int  not null default 3,
  route_color      text default '3b82f6',   -- hex WITHOUT #
  route_text_color text default 'ffffff',
  created_at       timestamptz default now()
);

-- ── Stops ────────────────────────────────────────────────────────────────────
create table public.bus_stops (
  stop_id    text primary key,
  stop_code  text,
  stop_name  text not null,
  stop_desc  text,
  stop_lat   numeric(9, 6) not null,
  stop_lon   numeric(9, 6) not null,
  zone_id    text,
  created_at timestamptz default now()
);

create index idx_bus_stops_location on public.bus_stops (stop_lat, stop_lon);

-- ── Shapes (polyline points for each route) ───────────────────────────────────
create table public.bus_shapes (
  shape_id          text not null,
  shape_pt_lat      numeric(9, 6) not null,
  shape_pt_lon      numeric(9, 6) not null,
  shape_pt_sequence int  not null,
  primary key (shape_id, shape_pt_sequence)
);

-- ── Trips ────────────────────────────────────────────────────────────────────
create table public.bus_trips (
  trip_id       text primary key,
  route_id      text not null references public.bus_routes (route_id),
  service_id    text not null,
  trip_headsign text,
  direction_id  int,
  shape_id      text,
  created_at    timestamptz default now()
);

create index idx_bus_trips_route_id   on public.bus_trips (route_id);
create index idx_bus_trips_service_id on public.bus_trips (service_id);
create index idx_bus_trips_shape_id   on public.bus_trips (shape_id);

-- ── Stop Times (428 k+ rows) ─────────────────────────────────────────────────
-- arrival_time stored as GTFS text "HH:MM:SS"; may exceed "23:59:59" for
-- overnight trips that started the previous calendar day.
create table public.bus_stop_times (
  trip_id        text not null,
  stop_id        text not null,
  arrival_time   text not null,
  departure_time text not null,
  stop_sequence  int  not null,
  pickup_type    int  default 0,
  drop_off_type  int  default 0,
  primary key (trip_id, stop_sequence)
);

create index idx_bus_stop_times_stop_id on public.bus_stop_times (stop_id);

-- ── Calendar Dates ───────────────────────────────────────────────────────────
create table public.bus_calendar_dates (
  service_id     text not null,
  date           date not null,
  exception_type int  not null,  -- 1=added, 2=removed
  primary key (service_id, date)
);

create index idx_bus_calendar_date on public.bus_calendar_dates (date);

-- ── User Favorites ────────────────────────────────────────────────────────────
create table public.user_bus_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  stop_id    text not null,
  created_at timestamptz default now(),
  unique (user_id, stop_id)
);

create index idx_user_bus_favorites_user on public.user_bus_favorites (user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.bus_routes         enable row level security;
alter table public.bus_stops          enable row level security;
alter table public.bus_shapes         enable row level security;
alter table public.bus_trips          enable row level security;
alter table public.bus_stop_times     enable row level security;
alter table public.bus_calendar_dates enable row level security;
alter table public.user_bus_favorites enable row level security;

create policy "Public read bus_routes"         on public.bus_routes         for select using (true);
create policy "Public read bus_stops"          on public.bus_stops          for select using (true);
create policy "Public read bus_shapes"         on public.bus_shapes         for select using (true);
create policy "Public read bus_trips"          on public.bus_trips          for select using (true);
create policy "Public read bus_stop_times"     on public.bus_stop_times     for select using (true);
create policy "Public read bus_calendar_dates" on public.bus_calendar_dates for select using (true);

create policy "Users manage bus favorites"
  on public.user_bus_favorites for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin write for GTFS tables (for future use)
create policy "Admin write bus_routes"         on public.bus_routes         for all using (is_admin());
create policy "Admin write bus_stops"          on public.bus_stops          for all using (is_admin());
create policy "Admin write bus_stop_times"     on public.bus_stop_times     for all using (is_admin());

-- ── RPC: Next arrivals at a stop ─────────────────────────────────────────────
-- Returns the next p_limit departures at p_stop_id today (Cyprus local time).
-- Filters out times > 24 h (overnight cross-day trips) for simplicity.
create or replace function public.get_next_bus_arrivals(
  p_stop_id  text,
  p_route_id text default null,
  p_limit    int  default 5
)
returns table (
  route_id         text,
  route_short_name text,
  route_long_name  text,
  route_color      text,
  route_text_color text,
  trip_headsign    text,
  arrival_time     text,
  minutes_until    int
)
language plpgsql stable security definer
as $$
declare
  v_today       date;
  v_now_secs    int;
  v_service_ids text[];
begin
  -- Cyprus is UTC+2 (winter) / UTC+3 (summer). Use 'Asia/Nicosia' for IANA.
  v_today    := (current_timestamp at time zone 'Asia/Nicosia')::date;
  v_now_secs := extract(epoch from (current_timestamp at time zone 'Asia/Nicosia')::time)::int;

  select array_agg(distinct service_id) into v_service_ids
  from   public.bus_calendar_dates
  where  date           = v_today
    and  exception_type = 1;

  if v_service_ids is null then
    return;
  end if;

  return query
  select
    r.route_id,
    r.route_short_name,
    r.route_long_name,
    coalesce(r.route_color,      '3b82f6') as route_color,
    coalesce(r.route_text_color, 'ffffff') as route_text_color,
    t.trip_headsign,
    st.arrival_time,
    (extract(epoch from st.arrival_time::interval)::int - v_now_secs) / 60 as minutes_until
  from  public.bus_stop_times st
  join  public.bus_trips  t on t.trip_id  = st.trip_id
  join  public.bus_routes r on r.route_id = t.route_id
  where st.stop_id = p_stop_id
    and (p_route_id is null or t.route_id = p_route_id)
    and  t.service_id = any(v_service_ids)
    -- only times that haven't passed yet and are within the same calendar day
    and extract(epoch from st.arrival_time::interval)::int >  v_now_secs
    and extract(epoch from st.arrival_time::interval)::int <  86400
  order by st.arrival_time::interval
  limit p_limit;
end;
$$;

-- ── RPC: Routes serving a stop ───────────────────────────────────────────────
create or replace function public.get_routes_at_stop(p_stop_id text)
returns table (
  route_id         text,
  route_short_name text,
  route_long_name  text,
  route_color      text,
  route_text_color text
)
language sql stable security definer
as $$
  select distinct
    r.route_id,
    r.route_short_name,
    r.route_long_name,
    coalesce(r.route_color,      '3b82f6'),
    coalesce(r.route_text_color, 'ffffff')
  from  public.bus_stop_times st
  join  public.bus_trips  t on t.trip_id  = st.trip_id
  join  public.bus_routes r on r.route_id = t.route_id
  where st.stop_id = p_stop_id
  order by r.route_short_name;
$$;

-- ── RPC: Directions for a route ───────────────────────────────────────────────
create or replace function public.get_route_directions(p_route_id text)
returns table (
  direction_id  int,
  trip_headsign text
)
language sql stable security definer
as $$
  select distinct
    coalesce(direction_id, 0)   as direction_id,
    max(trip_headsign)          as trip_headsign
  from  public.bus_trips
  where route_id = p_route_id
  group by direction_id
  order by direction_id;
$$;

-- ── RPC: Ordered stops for a route/direction ──────────────────────────────────
-- Picks the trip with the most stops (most representative) for that direction.
create or replace function public.get_route_stops_ordered(
  p_route_id   text,
  p_direction  int default 0
)
returns table (
  stop_id       text,
  stop_name     text,
  stop_lat      numeric,
  stop_lon      numeric,
  stop_sequence int
)
language sql stable security definer
as $$
  with representative_trip as (
    select t.trip_id
    from   public.bus_trips t
    join   public.bus_stop_times st on st.trip_id = t.trip_id
    where  t.route_id = p_route_id
      and  coalesce(t.direction_id, 0) = p_direction
    group  by t.trip_id
    order  by count(*) desc
    limit  1
  )
  select
    s.stop_id,
    s.stop_name,
    s.stop_lat,
    s.stop_lon,
    st.stop_sequence
  from  public.bus_stop_times st
  join  public.bus_stops s on s.stop_id = st.stop_id
  where st.trip_id = (select trip_id from representative_trip)
  order by st.stop_sequence;
$$;

-- ── RPC: Route shape polyline ─────────────────────────────────────────────────
create or replace function public.get_route_shape(
  p_route_id  text,
  p_direction int default 0
)
returns table (
  lat numeric,
  lon numeric,
  seq int
)
language sql stable security definer
as $$
  with shape as (
    select shape_id
    from   public.bus_trips
    where  route_id  = p_route_id
      and  shape_id is not null
      and  coalesce(direction_id, 0) = p_direction
    limit  1
  )
  select shape_pt_lat as lat, shape_pt_lon as lon, shape_pt_sequence as seq
  from   public.bus_shapes
  where  shape_id = (select shape_id from shape)
  order  by shape_pt_sequence;
$$;

-- ── RPC: GTFS import statistics (for admin panel) ─────────────────────────────
create or replace function public.get_gtfs_stats()
returns json
language sql stable security definer
as $$
  select json_build_object(
    'routes',         (select count(*) from public.bus_routes),
    'stops',          (select count(*) from public.bus_stops),
    'trips',          (select count(*) from public.bus_trips),
    'stop_times',     (select count(*) from public.bus_stop_times),
    'shape_points',   (select count(*) from public.bus_shapes),
    'calendar_dates', (select count(*) from public.bus_calendar_dates)
  );
$$;
