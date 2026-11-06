-- Run after installing the existing Promotions Engine schema.
begin;

alter table public.promotions
  add column if not exists mix_and_match boolean not null default false;

alter table public.promotions
  drop constraint if exists promotions_mix_and_match_valid;

alter table public.promotions
  add constraint promotions_mix_and_match_valid check (
    not mix_and_match or (
      type = 'buy_x_get_y' and scope = 'brand' and brand_id is not null
      and buy_quantity = 2 and get_quantity = 1 and discount_percent = 100
    ) is true
  );

notify pgrst, 'reload schema';
commit;
