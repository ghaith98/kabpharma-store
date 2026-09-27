-- Exact product-option promotions.
-- Safe to run after 202609260001_promotions.sql and safe to run more than once.
alter table public.promotions alter column category_id drop not null;
alter table public.promotions add column if not exists product_id bigint references public.products(id) on delete cascade;
alter table public.promotions add column if not exists variant_id bigint references public.product_variants(id) on delete cascade;

-- The old single-column UNIQUE constraint on product_id prevents selecting
-- more than one size (for example 50g and 100g) for the same product.
do $$
declare old_constraint text;
declare old_index text;
begin
  select conname into old_constraint
  from pg_constraint
  where conrelid = 'public.promotions'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 1
    and conkey[1] = (select attnum from pg_attribute where attrelid = 'public.promotions'::regclass and attname = 'product_id');
  if old_constraint is not null then
    execute format('alter table public.promotions drop constraint %I', old_constraint);
  end if;

  -- Covers the same rule when it was created as a unique index instead of
  -- a named table constraint.
  select indexrelid::regclass::text into old_index
  from pg_index
  where indrelid = 'public.promotions'::regclass
    and indisunique
    and indpred is null
    and indkey::smallint[] = array[(select attnum from pg_attribute where attrelid = 'public.promotions'::regclass and attname = 'product_id')::smallint];
  if old_index is not null then
    execute format('drop index if exists %s', old_index);
  end if;
end $$;

drop index if exists public.promotions_one_product_idx;
create unique index if not exists promotions_one_base_product_idx
  on public.promotions (product_id) where variant_id is null;
create unique index if not exists promotions_one_variant_idx
  on public.promotions (variant_id) where variant_id is not null;
create index if not exists promotions_product_lookup_idx on public.promotions (product_id, is_active);
create index if not exists promotions_variant_lookup_idx on public.promotions (variant_id, is_active);

-- Restore only the temporary Buy 2 Get 1 label introduced by an earlier draft.
update public.promotions
set name = 'Buy 2+1 Free'
where type = 'buy_2_get_1';

update public.promotions
set name = case type
  when 'buy_1_second_50' then 'اشتري 1، والثاني بنصف السعر'
  else name
end
where type = 'buy_1_second_50';

alter table public.orders add column if not exists promotion_id uuid references public.promotions(id) on delete set null;
alter table public.orders add column if not exists promotion_name text;
alter table public.orders add column if not exists promotion_discount_amount numeric not null default 0;
alter table public.orders add column if not exists promotion_details jsonb not null default '[]'::jsonb;
