alter table if exists public.product_reviews
  add column if not exists is_verified_purchase boolean
  not null default false;
