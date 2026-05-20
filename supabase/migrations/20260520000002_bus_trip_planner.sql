-- ============================================================================
-- Bus Trip Planner — Direct Routes
-- Finds single-bus journeys between two GPS coordinates.
-- ============================================================================

create or replace function public.plan_direct_trip(
  p_from_lat        numeric,
  p_from_lon        numeric,
  p_to_lat          numeric,
  p_to_lon          numeric,
  p_max_walk_meters int     default 500,
  p_limit           int     default 5
)
returns table (
  route_id                  text,
  route_short_name          text,
  route_long_name           text,
  route_color               text,
  route_text_color          text,
  from_stop_id              text,
  from_stop_name            text,
  from_stop_lat             numeric,
  from_stop_lon             numeric,
  from_stop_distance_meters int,
  to_stop_id                text,
  to_stop_name              text,
  to_stop_lat               numeric,
  to_stop_lon               numeric,
  to_stop_distance_meters   int,
  departure_time            timestamptz,
  arrival_time              timestamptz,
  trip_duration_minutes     int,
  stop_count                int
)
language plpgsql stable security definer
as $$
declare
  v_today       date;
  v_now_secs    int;
  v_service_ids text[];
begin
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
  with
    -- Stops near origin — bbox pre-filter then exact Haversine
    origin_stops as (
      select
        s.stop_id,
        s.stop_name,
        s.stop_lat,
        s.stop_lon,
        round(
          6371000 * acos(greatest(-1.0, least(1.0,
            cos(radians(p_from_lat::float)) * cos(radians(s.stop_lat::float))
              * cos(radians(s.stop_lon::float) - radians(p_from_lon::float))
            + sin(radians(p_from_lat::float)) * sin(radians(s.stop_lat::float))
          )))
        )::int as distance_meters
      from public.bus_stops s
      where abs(s.stop_lat - p_from_lat) < 0.01   -- ≈ 1.1 km bbox
        and abs(s.stop_lon - p_from_lon) < 0.015
    ),
    origin_stops_f as (
      select * from origin_stops where distance_meters <= p_max_walk_meters
    ),

    -- Stops near destination
    dest_stops as (
      select
        s.stop_id,
        s.stop_name,
        s.stop_lat,
        s.stop_lon,
        round(
          6371000 * acos(greatest(-1.0, least(1.0,
            cos(radians(p_to_lat::float)) * cos(radians(s.stop_lat::float))
              * cos(radians(s.stop_lon::float) - radians(p_to_lon::float))
            + sin(radians(p_to_lat::float)) * sin(radians(s.stop_lat::float))
          )))
        )::int as distance_meters
      from public.bus_stops s
      where abs(s.stop_lat - p_to_lat) < 0.01
        and abs(s.stop_lon - p_to_lon) < 0.015
    ),
    dest_stops_f as (
      select * from dest_stops where distance_meters <= p_max_walk_meters
    ),

    -- Trips that serve an origin stop then a destination stop (in correct order)
    matching_trips as (
      select distinct on (t.route_id, st_from.stop_id, st_to.stop_id)
        t.trip_id,
        t.route_id,
        st_from.stop_id        as from_stop_id,
        st_from.arrival_time   as dep_time_text,
        st_from.stop_sequence  as from_seq,
        st_to.stop_id          as to_stop_id,
        st_to.arrival_time     as arr_time_text,
        st_to.stop_sequence    as to_seq
      from  public.bus_trips t
      join  public.bus_stop_times st_from on st_from.trip_id = t.trip_id
      join  public.bus_stop_times st_to   on st_to.trip_id   = t.trip_id
      where t.service_id = any(v_service_ids)
        and st_from.stop_id in (select stop_id from origin_stops_f)
        and st_to.stop_id   in (select stop_id from dest_stops_f)
        and st_from.stop_sequence < st_to.stop_sequence
        -- departure must be in the future and within the same calendar day
        and extract(epoch from st_from.arrival_time::interval)::int > v_now_secs
        and extract(epoch from st_from.arrival_time::interval)::int < 86400
      order by t.route_id, st_from.stop_id, st_to.stop_id,
               st_from.arrival_time::interval   -- earliest departure for each combination
    )

  select
    r.route_id,
    r.route_short_name,
    r.route_long_name,
    coalesce(r.route_color,      '3b82f6') as route_color,
    coalesce(r.route_text_color, 'ffffff') as route_text_color,
    mt.from_stop_id,
    os.stop_name   as from_stop_name,
    os.stop_lat    as from_stop_lat,
    os.stop_lon    as from_stop_lon,
    os.distance_meters::int as from_stop_distance_meters,
    mt.to_stop_id,
    ds.stop_name   as to_stop_name,
    ds.stop_lat    as to_stop_lat,
    ds.stop_lon    as to_stop_lon,
    ds.distance_meters::int as to_stop_distance_meters,
    -- Convert GTFS local time to proper timestamptz
    (v_today + mt.dep_time_text::interval) at time zone 'Asia/Nicosia' as departure_time,
    (v_today + mt.arr_time_text::interval) at time zone 'Asia/Nicosia' as arrival_time,
    (
      extract(epoch from mt.arr_time_text::interval)::int
      - extract(epoch from mt.dep_time_text::interval)::int
    ) / 60 as trip_duration_minutes,
    (mt.to_seq - mt.from_seq + 1) as stop_count

  from  matching_trips mt
  join  public.bus_routes     r  on r.route_id  = mt.route_id
  join  origin_stops_f        os on os.stop_id  = mt.from_stop_id
  join  dest_stops_f          ds on ds.stop_id  = mt.to_stop_id
  order by mt.dep_time_text::interval
  limit p_limit;
end;
$$;
