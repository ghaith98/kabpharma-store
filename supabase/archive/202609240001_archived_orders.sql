-- Run this SQL in the NEW, SEPARATE Supabase ARCHIVE project only.

create table if not exists public.archived_orders (
  archive_id bigint generated always as identity primary key,
  source_order_id bigint not null unique,
  customer_name text,
  phone text,
  status text,
  created_at timestamptz,
  finalized_at timestamptz,
  archived_at timestamptz not null default now(),
  order_data jsonb not null,
  items_data jsonb not null default '[]'::jsonb
);

create index if not exists archived_orders_phone_idx
  on public.archived_orders (phone);
create index if not exists archived_orders_finalized_at_idx
  on public.archived_orders (finalized_at desc);
create index if not exists archived_orders_customer_name_idx
  on public.archived_orders (customer_name);

alter table public.archived_orders enable row level security;

-- Archive data is accessed only by the main website's server using the archive
-- project's server-only service-role key. No browser policy is created.
