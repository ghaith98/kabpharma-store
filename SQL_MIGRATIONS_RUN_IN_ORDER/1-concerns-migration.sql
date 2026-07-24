-- Run this once in Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists concerns (
  id bigint generated always as identity primary key,
  name_ar text not null,
  name_en text not null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists product_concerns (
  product_id bigint not null references products(id) on delete cascade,
  concern_id bigint not null references concerns(id) on delete cascade,
  primary key (product_id, concern_id)
);

alter table concerns enable row level security;
alter table product_concerns enable row level security;

-- Public (anonymous) read access, same as the categories table.
create policy "Public read concerns"
  on concerns for select
  using (true);

create policy "Public read product_concerns"
  on product_concerns for select
  using (true);

-- Any logged-in Supabase user (i.e. your admin account) can manage both
-- tables. This mirrors whatever write policy your `categories` table
-- already uses today. If your admin write access is gated some other
-- way (e.g. a staff table), adjust these two policies to match.
create policy "Authenticated manage concerns"
  on concerns for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated manage product_concerns"
  on product_concerns for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
