begin;

alter table public.product_variants
  add column if not exists description_ar text,
  add column if not exists description_en text,
  add column if not exists ingredients_ar text,
  add column if not exists ingredients_en text;

notify pgrst, 'reload schema';
commit;
