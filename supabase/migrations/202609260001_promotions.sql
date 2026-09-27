-- Automatic category promotions. Apply once in the Supabase SQL editor.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  type text not null check (type in ('buy_2_get_1', 'buy_1_second_50')),
  category_id bigint not null references public.categories(id) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  max_uses_per_order integer check (max_uses_per_order is null or max_uses_per_order > 0),
  allow_with_coupon boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists promotions_lookup_idx
  on public.promotions (is_active, category_id, starts_at, ends_at);

alter table public.orders add column if not exists promotion_id uuid references public.promotions(id) on delete set null;
alter table public.orders add column if not exists promotion_name text;
alter table public.orders add column if not exists promotion_discount_amount numeric not null default 0;

alter table public.promotions enable row level security;
drop policy if exists admin_role_required_promotions on public.promotions;
create policy admin_role_required_promotions on public.promotions
  as restrictive for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
