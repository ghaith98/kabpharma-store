-- MAIN Supabase project. Transactional: a failed preflight leaves no partial setup.
begin;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='coupon_usages' and column_name='idempotency_key') then
    raise exception 'Expected coupon_usages.idempotency_key';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='customer_profile_id') then
    raise exception 'Expected orders.customer_profile_id';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='idempotency_key') then
    raise exception 'Expected orders.idempotency_key';
  end if;
end $$;

alter table public.coupons
  add column if not exists first_order_only boolean not null default false,
  add column if not exists assigned_profile_id bigint;
-- Preserve the target ID if that account is later deleted: the coupon must
-- never silently become public, and it must not prevent account deletion.
create or replace function public.validate_coupon_target()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.assigned_profile_id is not null then
    if tg_op='INSERT' or new.assigned_profile_id is distinct from old.assigned_profile_id then
      if not exists(select 1 from public.profiles where id=new.assigned_profile_id) then
        raise exception 'Select an existing customer';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.validate_coupon_target() from public,anon,authenticated;
drop trigger if exists coupons_validate_target on public.coupons;
create trigger coupons_validate_target before insert or update of assigned_profile_id on public.coupons
  for each row execute function public.validate_coupon_target();
-- Reuse the existing verified customer ID and order attempt key.
-- Do not introduce a competing customer identity column.
update public.orders o set customer_profile_id=u.profile_id
from public.coupon_usages u
where o.idempotency_key=u.idempotency_key and o.customer_profile_id is null
  and exists(select 1 from public.profiles p where p.id=u.profile_id)
  and not exists(select 1 from public.coupon_usages other where other.idempotency_key=u.idempotency_key and other.profile_id<>u.profile_id);

-- Match remaining legacy orders by the same phone stored on the profile.
-- Refuse ambiguous matches instead of assigning somebody else's order.
do $$
begin
  if exists (select 1 from public.profiles where phone is not null and regexp_replace(phone,'[^0-9]','','g')<>'' group by regexp_replace(phone, '[^0-9]', '', 'g') having count(*) > 1) then
    raise exception 'Duplicate normalized profile phones: resolve these before installing first-order coupons.';
  end if;
end $$;
update public.orders o set customer_profile_id=p.id
from public.profiles p
where o.customer_profile_id is null and regexp_replace(o.phone,'[^0-9]','','g')<>''
  and regexp_replace(o.phone, '[^0-9]', '', 'g')=regexp_replace(p.phone, '[^0-9]', '', 'g');

create index if not exists orders_coupon_customer_idx
  on public.orders(customer_profile_id, coupon_code)
  where status not in ('rejected','cancelled_by_customer');

create or replace function public.check_coupon_customer(p_code text, p_profile_id bigint, p_exclude_order_id bigint default null, p_exclude_idempotency_key text default null)
returns text language plpgsql security definer set search_path=public as $$
declare c public.coupons%rowtype;
begin
  select * into c from public.coupons where code=p_code;
  if not found or not c.is_active then return 'invalid'; end if;
  if c.assigned_profile_id is not null and c.assigned_profile_id is distinct from p_profile_id then return 'not_assigned'; end if;
  if p_profile_id is null then return 'invalid'; end if;
  if c.first_order_only and exists (
    select 1 from public.orders where customer_profile_id=p_profile_id
      and (p_exclude_order_id is null or id<>p_exclude_order_id)
      and coalesce(status,'pending') not in ('rejected','cancelled_by_customer')
  ) then return 'first_order_only'; end if;
  if c.one_use_per_customer and exists (
    select 1 from public.orders where customer_profile_id=p_profile_id and coupon_code=p_code
      and (p_exclude_order_id is null or id<>p_exclude_order_id)
      and coalesce(status,'pending') not in ('rejected','cancelled_by_customer')
  ) then return 'already_used'; end if;
  -- Preserve unmatched historical reservations. Without their order history
  -- we cannot assert that the order was cancelled or rejected.
  if c.one_use_per_customer and exists (
    select 1 from public.coupon_usages u where u.coupon_id=c.id and u.profile_id=p_profile_id
      and (p_exclude_idempotency_key is null or u.idempotency_key is distinct from p_exclude_idempotency_key)
      and not exists(select 1 from public.orders o where o.idempotency_key=u.idempotency_key
        and o.customer_profile_id=u.profile_id and o.status in ('rejected','cancelled_by_customer'))
      and not exists(select 1 from public.orders o where o.id=p_exclude_order_id and o.idempotency_key=u.idempotency_key and o.customer_profile_id=u.profile_id)
  ) then return 'already_used'; end if;
  return null;
end $$;
revoke all on function public.check_coupon_customer(text,bigint,bigint,text) from public,anon,authenticated;
grant execute on function public.check_coupon_customer(text,bigint,bigint,text) to service_role;

create or replace function public.guard_order_coupon_customer()
returns trigger language plpgsql security definer set search_path=public as $$
declare reason text; context_id text;
begin
  if tg_op='INSERT' then
    context_id:=current_setting('kab.coupon_profile_id',true);
    if nullif(context_id,'') is not null then
      new.customer_profile_id:=context_id::bigint;
    elsif new.customer_profile_id is null then
      select id into new.customer_profile_id from public.profiles
      where regexp_replace(phone,'[^0-9]','','g')=regexp_replace(new.phone,'[^0-9]','','g');
    end if;
  end if;
  -- Every new order takes the same customer lock, including orders without
  -- coupons, so two simultaneous first orders cannot both receive a discount.
  if new.customer_profile_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('kab-coupon:'||new.customer_profile_id::text,0));
  end if;
  if tg_op='UPDATE' and old.customer_profile_id is not null and new.customer_profile_id is not null and new.customer_profile_id is distinct from old.customer_profile_id then
    raise exception 'Coupon customer identity cannot be changed';
  end if;
  if new.coupon_code is not null and coalesce(new.status,'pending') not in ('rejected','cancelled_by_customer') then
    if tg_op='INSERT' or old.status in ('rejected','cancelled_by_customer') or new.coupon_code is distinct from old.coupon_code then
      reason:=public.check_coupon_customer(new.coupon_code,new.customer_profile_id,new.id,new.idempotency_key);
      if reason is not null then raise exception 'COUPON_RULE:%',reason using errcode='P0001'; end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_order_coupon_customer() from public,anon,authenticated;
drop trigger if exists orders_guard_coupon_customer on public.orders;
create trigger orders_guard_coupon_customer before insert or update of status,coupon_code,customer_profile_id
  on public.orders for each row execute function public.guard_order_coupon_customer();

create or replace function public.release_cancelled_coupon_usage()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('rejected','cancelled_by_customer') then
    delete from public.coupon_usages u using public.coupons c
    where u.idempotency_key=new.idempotency_key and u.profile_id=new.customer_profile_id
      and c.id=u.coupon_id and c.code=new.coupon_code;
  end if;
  return new;
end $$;
revoke all on function public.release_cancelled_coupon_usage() from public,anon,authenticated;
drop trigger if exists orders_release_coupon_usage on public.orders;
create trigger orders_release_coupon_usage after update of status on public.orders
  for each row execute function public.release_cancelled_coupon_usage();
delete from public.coupon_usages u using public.orders o
where u.idempotency_key=o.idempotency_key and u.profile_id=o.customer_profile_id
  and o.status in ('rejected','cancelled_by_customer')
  and exists(select 1 from public.coupons c where c.id=u.coupon_id and c.code=o.coupon_code);

-- Keep the installed atomic order function and its return type unchanged.
-- Generate a server-only wrapper from its actual signature, not guessed types.
do $$
declare f record; args text; call_args text; result_type text; body text;
begin
  select p.* into strict f from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='create_order_with_coupon_atomic';
  if not ('p_customer_profile_id'=any(f.proargnames)) then raise exception 'Order RPC missing customer profile argument'; end if;
  execute format('revoke all on function public.create_order_with_coupon_atomic(%s) from public,anon,authenticated',pg_get_function_identity_arguments(f.oid));
  execute format('grant execute on function public.create_order_with_coupon_atomic(%s) to service_role',pg_get_function_identity_arguments(f.oid));
  args:=pg_get_function_arguments(f.oid);
  result_type:=pg_get_function_result(f.oid);
  select string_agg(quote_ident(f.proargnames[i]),', ' order by i) into call_args
    from generate_series(1,f.pronargs) i;
  body:='declare reason text; begin '
    ||'perform pg_advisory_xact_lock(hashtextextended(''kab-coupon:''||p_customer_profile_id::text,0)); '
    ||'if exists(select 1 from public.orders where idempotency_key=p_idempotency_key and customer_profile_id is distinct from p_customer_profile_id) then raise exception ''COUPON_RULE:invalid''; end if; '
    ||'if p_coupon_code is not null and not exists(select 1 from public.orders where idempotency_key=p_idempotency_key and customer_profile_id=p_customer_profile_id) then '
    ||'reason:=public.check_coupon_customer(p_coupon_code,p_customer_profile_id,null); if reason is not null then raise exception ''COUPON_RULE:%'',reason; end if; end if; '
    ||'perform set_config(''kab.coupon_profile_id'',p_customer_profile_id::text,true); '
    ||case when f.proretset then 'return query select * from ' else 'return ' end
    ||'public.create_order_with_coupon_atomic('||call_args||'); end';
  execute format('create or replace function public.create_order_with_coupon_rules(%s) returns %s language plpgsql security definer set search_path=public as %L',args,result_type,body);
  execute format('revoke all on function public.create_order_with_coupon_rules(%s) from public,anon,authenticated',pg_get_function_identity_arguments(f.oid));
  execute format('grant execute on function public.create_order_with_coupon_rules(%s) to service_role',pg_get_function_identity_arguments(f.oid));
end $$;
notify pgrst,'reload schema';
commit;
