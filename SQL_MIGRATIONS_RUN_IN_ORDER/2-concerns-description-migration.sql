-- Run this in Supabase SQL Editor (adds description fields to the existing concerns table)

alter table concerns
  add column if not exists description_ar text,
  add column if not exists description_en text;
