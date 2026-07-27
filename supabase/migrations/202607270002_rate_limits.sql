create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  window_started_at timestamptz not null default now(),
  last_request_at timestamptz not null default now()
);

alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from public, anon, authenticated;

create or replace function public.take_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.rate_limits%rowtype;
  current_time timestamptz := clock_timestamp();
begin
  if length(p_key) < 1
     or length(p_key) > 500
     or p_limit < 1
     or p_window_seconds < 1 then
    raise exception 'Invalid rate-limit parameters'
      using errcode = '22023';
  end if;

  insert into public.rate_limits (
    key,
    count,
    window_started_at,
    last_request_at
  )
  values (p_key, 0, current_time, current_time)
  on conflict (key) do nothing;

  select *
  into current_row
  from public.rate_limits
  where key = p_key
  for update;

  if current_row.window_started_at +
       make_interval(secs => p_window_seconds) <= current_time then
    current_row.count := 1;
    current_row.window_started_at := current_time;
    current_row.last_request_at := current_time;
  else
    current_row.count := current_row.count + 1;
    current_row.last_request_at := current_time;
  end if;

  update public.rate_limits
  set
    count = current_row.count,
    window_started_at = current_row.window_started_at,
    last_request_at = current_row.last_request_at
  where key = p_key;

  allowed := current_row.count <= p_limit;
  retry_after_seconds :=
    case
      when allowed then 0
      else greatest(
        1,
        ceil(
          extract(
            epoch from (
              current_row.window_started_at +
              make_interval(secs => p_window_seconds) -
              current_time
            )
          )
        )::integer
      )
    end;
  return next;
end;
$$;

create or replace function public.take_otp_backoff(
  p_key text,
  p_max_per_hour integer default 6
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.rate_limits%rowtype;
  current_time timestamptz := clock_timestamp();
  required_wait integer;
  elapsed_seconds integer;
begin
  if length(p_key) < 1
     or length(p_key) > 500
     or p_max_per_hour < 1 then
    raise exception 'Invalid OTP backoff parameters'
      using errcode = '22023';
  end if;

  insert into public.rate_limits (
    key,
    count,
    window_started_at,
    last_request_at
  )
  values (p_key, 0, current_time, current_time)
  on conflict (key) do nothing;

  select *
  into current_row
  from public.rate_limits
  where key = p_key
  for update;

  if current_row.window_started_at + interval '1 hour' <= current_time then
    current_row.count := 0;
    current_row.window_started_at := current_time;
  end if;

  if current_row.count >= p_max_per_hour then
    allowed := false;
    retry_after_seconds := greatest(
      1,
      ceil(
        extract(
          epoch from (
            current_row.window_started_at +
            interval '1 hour' -
            current_time
          )
        )
      )::integer
    );
    return next;
    return;
  end if;

  required_wait :=
    case
      when current_row.count = 0 then 0
      when current_row.count = 1 then 60
      when current_row.count = 2 then 120
      when current_row.count = 3 then 300
      else 600
    end;
  elapsed_seconds := floor(
    extract(
      epoch from (
        current_time - current_row.last_request_at
      )
    )
  )::integer;

  if elapsed_seconds < required_wait then
    allowed := false;
    retry_after_seconds :=
      required_wait - elapsed_seconds;
    return next;
    return;
  end if;

  update public.rate_limits
  set
    count = current_row.count + 1,
    window_started_at =
      current_row.window_started_at,
    last_request_at = current_time
  where key = p_key;

  allowed := true;
  retry_after_seconds := 0;
  return next;
end;
$$;

revoke all on function public.take_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.take_otp_backoff(text, integer)
  from public, anon, authenticated;

grant execute on function public.take_rate_limit(text, integer, integer)
  to service_role;
grant execute on function public.take_otp_backoff(text, integer)
  to service_role;
