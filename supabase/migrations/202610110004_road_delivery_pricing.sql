begin;
alter table public.orders add column if not exists delivery_location jsonb;
alter table public.orders add column if not exists delivery_pricing jsonb;

create or replace function public.valid_delivery_location(location jsonb)
returns boolean language plpgsql immutable set search_path=public as $$
begin
  if location is null or location='null'::jsonb then return true; end if;
  if jsonb_typeof(location) <> 'object' then return false; end if;
  if location ? 'url' then
    return jsonb_typeof(location->'url')='string'
      and length(location->>'url')<=2048
      and (location->>'url') ~ '^https://(maps[.]app[.]goo[.]gl/[^/]+|goo[.]gl/maps/[^/]+|(www[.])?google[.]com/maps([/?#].*)?|maps[.]google[.]com/.*)$';
  end if;
  if jsonb_typeof(location->'latitude') is distinct from 'number'
    or jsonb_typeof(location->'longitude') is distinct from 'number' then return false; end if;
  return (location->>'latitude')::numeric between -90 and 90
    and (location->>'longitude')::numeric between -180 and 180;
end $$;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='orders_delivery_location_valid' and conrelid='public.orders'::regclass) then
    alter table public.orders add constraint orders_delivery_location_valid check(public.valid_delivery_location(delivery_location));
  end if;
end $$;

-- Attach the one-time location inside the existing atomic order transaction.
-- An idempotent retry returns the first order without changing its location.
create or replace function public.attach_order_delivery_location()
returns trigger language plpgsql set search_path=public as $$
declare location jsonb;
begin
  location:=nullif(current_setting('kab.delivery_location',true),'')::jsonb;
  if location is not null and location <> 'null'::jsonb then
    if not public.valid_delivery_location(location) then raise exception 'INVALID_DELIVERY_LOCATION'; end if;
    new.delivery_location:=location;
    new.delivery_pricing:=nullif(current_setting('kab.delivery_pricing',true),'')::jsonb;
  end if;
  return new;
end $$;
drop trigger if exists orders_attach_delivery_location on public.orders;
create trigger orders_attach_delivery_location before insert on public.orders
  for each row execute function public.attach_order_delivery_location();

-- Use the installed coupon wrapper's exact signature and return type.
do $$
declare f record; args text; call_args text; result_type text; body text;
begin
  select p.* into strict f from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_order_with_coupon_rules';
  if not ('p_order'=any(f.proargnames)) then raise exception 'Order RPC missing p_order'; end if;
  args:=pg_get_function_arguments(f.oid);
  result_type:=pg_get_function_result(f.oid);
  select string_agg(quote_ident(f.proargnames[i]),', ' order by i) into call_args
    from generate_series(1,f.pronargs) i;
  body:='begin '
    ||'if not public.valid_delivery_location(p_order->''delivery_location'') then raise exception ''INVALID_DELIVERY_LOCATION''; end if; '
    ||'perform set_config(''kab.delivery_location'',coalesce((p_order->''delivery_location'')::text,''null''),true); '
    ||'perform set_config(''kab.delivery_pricing'',coalesce((p_order->''delivery_pricing'')::text,''null''),true); '
    ||case when f.proretset then 'return query select * from ' else 'return ' end
    ||'public.create_order_with_coupon_rules('||call_args||'); end';
  execute format('create or replace function public.create_order_with_delivery_location(%s) returns %s language plpgsql security definer set search_path=public as %L',args,result_type,body);
  execute format('revoke all on function public.create_order_with_delivery_location(%s) from public,anon,authenticated',pg_get_function_identity_arguments(f.oid));
  execute format('grant execute on function public.create_order_with_delivery_location(%s) to service_role',pg_get_function_identity_arguments(f.oid));
end $$;
notify pgrst,'reload schema';
commit;
