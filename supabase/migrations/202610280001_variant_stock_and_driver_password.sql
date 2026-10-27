-- Apply to the MAIN Supabase project before deploying this update.
-- Existing product-wide flags keep their meaning. No quantities are used.
begin;

alter table public.product_variants
  add column if not exists is_out_of_stock boolean not null default false;
alter table public.products
  add column if not exists is_main_size_out_of_stock boolean not null default false;

create extension if not exists pgcrypto;

create or replace function public.create_delivery_driver_admin(
  p_name text,
  p_password text
)
returns table (
  id text,
  name text,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_name is null or p_password is null
     or length(trim(p_name)) < 2
     or length(p_password) < 1
     or length(p_password) > 200 then
    raise exception 'Invalid staff account data'
      using errcode = '22023';
  end if;

  return query
  insert into public.delivery_drivers (
    name,
    password,
    is_active
  )
  values (
    trim(p_name),
    crypt(p_password, gen_salt('bf', 12)),
    true
  )
  returning
    delivery_drivers.id::text,
    delivery_drivers.name,
    delivery_drivers.is_active,
    delivery_drivers.created_at;
end;
$$;

revoke all on function public.create_delivery_driver_admin(text, text)
  from public, anon, authenticated;
grant execute on function public.create_delivery_driver_admin(text, text)
  to service_role;

notify pgrst, 'reload schema';
commit;
