create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      ''
    ) = 'admin'
    or coalesce(
      (
        auth.jwt() -> 'app_metadata' ->> 'admin'
      )::boolean,
      false
    )
    or coalesce(
      auth.jwt() -> 'app_metadata' -> 'roles',
      '[]'::jsonb
    ) ? 'admin';
$$;

grant execute on function public.is_admin()
  to authenticated;

do $$
declare
  table_name text;
  protected_tables text[] := array[
    'orders',
    'order_items',
    'profiles',
    'products',
    'product_variants',
    'product_images',
    'product_variant_images',
    'categories',
    'concerns',
    'product_concerns',
    'home_banners',
    'settings',
    'delivery_fees',
    'delivery_areas',
    'delivery_orders',
    'delivery_drivers',
    'delivery_companies',
    'coupons',
    'coupon_usages',
    'product_reviews'
  ];
  policy_name text;
begin
  foreach table_name in array protected_tables loop
    if to_regclass('public.' || table_name) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I enable row level security',
      table_name
    );

    policy_name := 'admin_role_required_' || table_name;
    execute format(
      'drop policy if exists %I on public.%I',
      policy_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      policy_name,
      table_name
    );
  end loop;
end;
$$;
