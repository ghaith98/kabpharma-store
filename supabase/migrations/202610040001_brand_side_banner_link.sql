-- Lets each brand's side banner link to a chosen page or product
-- (Admin > Brands > "Side banner: when clicked, go to").
-- Empty = scroll to that brand's products, as before.
--
-- Run this in the Supabase SQL editor BEFORE deploying the matching code,
-- otherwise saving a brand in the admin panel will fail.

alter table public.brands
  add column if not exists side_banner_link_url text;
