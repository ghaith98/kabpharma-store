-- Run once before using Admin > Banners > Brands discovery banner.
-- Preserve existing placements and banner data. No permissions are changed.
begin;
alter table public.home_banners
  add column if not exists show_text boolean not null default true;

-- Widen any existing placement CHECK without guessing its allowed values/name.
do $$
declare
  existing record;
  expression text;
  placement_type text;
  is_enum boolean;
begin
  select format('%I.%I', n.nspname, t.typname), t.typtype = 'e'
    into placement_type, is_enum
    from pg_attribute a
    join pg_type t on t.oid = a.atttypid
    join pg_namespace n on n.oid = t.typnamespace
    where a.attrelid = 'public.home_banners'::regclass
      and a.attname = 'placement';
  if is_enum then
    execute format('alter type %s add value if not exists %L', placement_type, 'brands_discovery');
  end if;
  for existing in
      select c.conname, pg_get_expr(c.conbin, c.conrelid) as expression
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid
        and a.attnum = any(c.conkey) and a.attname = 'placement'
      where c.conrelid = 'public.home_banners'::regclass and c.contype = 'c'
        and cardinality(c.conkey) = 1
    loop
      expression := existing.expression;
      if position('brands_discovery' in expression) = 0 then
        execute format('alter table public.home_banners drop constraint %I', existing.conname);
        execute format('alter table public.home_banners add constraint %I check ((%s) or placement::text = %L)', existing.conname, expression, 'brands_discovery');
      end if;
  end loop;
end $$;
commit;
