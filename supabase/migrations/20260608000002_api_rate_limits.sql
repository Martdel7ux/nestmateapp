-- Per-user rate limiting for expensive edge functions (AI/LLM endpoints).
-- Without this, any authenticated user can spam the assistant / smart-search /
-- translate / description endpoints and run up the Anthropic/OpenAI bill or use
-- the app as a free LLM proxy.

create table if not exists public.api_rate_limits (
  user_id      uuid not null references auth.users (id) on delete cascade,
  bucket       text not null,
  window_start timestamptz not null default timezone('utc', now()),
  count        integer not null default 0,
  primary key (user_id, bucket)
);

-- Only the service role (used by edge functions, bypasses RLS) touches this
-- table. Enable RLS with no policies so it is unreadable/unwritable by clients.
alter table public.api_rate_limits enable row level security;

-- Atomically record one request against a fixed window and report whether the
-- caller is still within `_max` requests per `_window_seconds`.
create or replace function public.consume_rate_limit(
  _user_id uuid,
  _bucket text,
  _max integer,
  _window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _now     timestamptz := timezone('utc', now());
  _allowed boolean;
begin
  insert into public.api_rate_limits as r (user_id, bucket, window_start, count)
  values (_user_id, _bucket, _now, 1)
  on conflict (user_id, bucket) do update
    set window_start = case
          when r.window_start < _now - make_interval(secs => _window_seconds)
          then _now else r.window_start end,
        count = case
          when r.window_start < _now - make_interval(secs => _window_seconds)
          then 1 else r.count + 1 end
  returning count <= _max into _allowed;

  return _allowed;
end;
$$;

-- Callable only by the service role — never directly by app users.
revoke all on function public.consume_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(uuid, text, integer, integer)
  to service_role;
