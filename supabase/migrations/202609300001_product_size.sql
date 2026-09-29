-- Size for single-size products (e.g. "200 مل" / "200 ml").
--
-- Products with options (product_variants) keep using the option labels.
-- These columns are optional: existing products are unaffected and simply
-- show no size until one is entered in the admin panel.
--
-- Run this in the Supabase SQL editor BEFORE deploying the matching code,
-- because the store now reads these two columns.

alter table public.products
  add column if not exists size_ar text,
  add column if not exists size_en text;
