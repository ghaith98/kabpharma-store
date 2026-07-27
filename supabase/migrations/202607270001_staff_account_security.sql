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
  if length(trim(p_name)) < 2
     or length(p_password) < 10
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

create or replace function public.create_delivery_company_admin(
  p_company_name text,
  p_username text,
  p_password text
)
returns table (
  id text,
  company_name text,
  username text,
  is_active boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(trim(p_company_name)) < 2
     or length(trim(p_username)) < 2
     or length(p_password) < 10
     or length(p_password) > 200 then
    raise exception 'Invalid staff account data'
      using errcode = '22023';
  end if;

  return query
  insert into public.delivery_companies (
    company_name,
    username,
    password,
    is_active,
    is_online
  )
  values (
    trim(p_company_name),
    trim(p_username),
    crypt(p_password, gen_salt('bf', 12)),
    true,
    false
  )
  returning
    delivery_companies.id::text,
    delivery_companies.company_name,
    delivery_companies.username,
    delivery_companies.is_active;
end;
$$;

revoke all on function public.create_delivery_driver_admin(text, text)
  from public, anon, authenticated;
revoke all on function public.create_delivery_company_admin(text, text, text)
  from public, anon, authenticated;

grant execute on function public.create_delivery_driver_admin(text, text)
  to service_role;
grant execute on function public.create_delivery_company_admin(text, text, text)
  to service_role;
