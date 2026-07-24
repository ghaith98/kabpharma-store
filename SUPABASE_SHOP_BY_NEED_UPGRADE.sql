-- Run this once in the Supabase SQL Editor before deploying the updated code.
-- It separates the homepage tile from the desktop and mobile page banners.

alter table public.concerns
  add column if not exists image_url_mobile text,
  add column if not exists banner_image_url text,
  add column if not exists banner_image_url_mobile text;

-- Compatibility with the previous two-image version. This is safe to run again.
update public.concerns
set
  banner_image_url = coalesce(banner_image_url, image_url),
  banner_image_url_mobile = coalesce(
    banner_image_url_mobile,
    image_url_mobile,
    banner_image_url,
    image_url
  )
where banner_image_url is null
   or banner_image_url_mobile is null;

comment on column public.concerns.image_url is
  'Independent square tile image used on the customer homepage.';

comment on column public.concerns.banner_image_url is
  'Desktop hero banner for the standalone Shop by Need page (1600 x 620).';

comment on column public.concerns.banner_image_url_mobile is
  'Mobile hero banner for the standalone Shop by Need page (800 x 400).';
