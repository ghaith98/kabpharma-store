-- Run this once in Supabase SQL Editor before testing the new promotions screen.
-- It is safe to run after the earlier promotions SQL.

alter table public.promotions alter column category_id drop not null;
alter table public.promotions add column if not exists product_id bigint references public.products(id) on delete cascade;
alter table public.promotions add column if not exists variant_id bigint references public.product_variants(id) on delete cascade;

drop index if exists public.promotions_one_product_idx;
create unique index if not exists promotions_one_base_product_idx
  on public.promotions (product_id) where variant_id is null;
create unique index if not exists promotions_one_variant_idx
  on public.promotions (variant_id) where variant_id is not null;
create index if not exists promotions_product_lookup_idx on public.promotions (product_id, is_active);
create index if not exists promotions_variant_lookup_idx on public.promotions (variant_id, is_active);
