-- Run this in Supabase SQL Editor.
-- Adds mobile image + desktop/mobile crop controls to concerns,
-- matching the exact fields already used by home_banners.

alter table concerns
  add column if not exists image_url_mobile text,
  add column if not exists desktop_position_x numeric,
  add column if not exists desktop_position_y numeric,
  add column if not exists desktop_zoom numeric,
  add column if not exists mobile_position_x numeric,
  add column if not exists mobile_position_y numeric,
  add column if not exists mobile_zoom numeric;
