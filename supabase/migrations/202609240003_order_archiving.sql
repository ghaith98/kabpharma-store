-- Run this migration in the MAIN KAB Pharma Supabase project.
-- It marks a rejected/cancelled order with its actual final time, then provides a
-- transactional removal function called only after the order is safely copied
-- to the separate archive project.

alter table public.orders
  add column if not exists finalized_at timestamptz;

update public.orders
set finalized_at = created_at
where status in ('rejected', 'cancelled_by_customer')
  and finalized_at is null;

create or replace function public.set_order_finalized_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('rejected', 'cancelled_by_customer')
     and old.status is distinct from new.status then
    new.finalized_at = now();
  elsif new.status not in ('rejected', 'cancelled_by_customer')
     and old.status is distinct from new.status then
    new.finalized_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_set_finalized_at on public.orders;
create trigger orders_set_finalized_at
before update of status on public.orders
for each row execute function public.set_order_finalized_at();

create index if not exists orders_archive_eligibility_idx
  on public.orders (finalized_at)
  where status in ('rejected', 'cancelled_by_customer');

-- Keep a tiny permanent sales aggregate in the live database. This preserves
-- best-seller rankings even after old order_items are moved to the archive.
create table if not exists public.product_sales_totals (
  product_id bigint primary key references public.products(id) on delete cascade,
  units_sold bigint not null default 0 check (units_sold >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_sales_totals enable row level security;
drop policy if exists "public_can_read_product_sales_totals" on public.product_sales_totals;
create policy "public_can_read_product_sales_totals"
  on public.product_sales_totals
  for select
  using (true);

insert into public.product_sales_totals (product_id, units_sold, updated_at)
select product_id, sum(quantity)::bigint, now()
from public.order_items
where product_id is not null
group by product_id
on conflict (product_id) do update
set units_sold = excluded.units_sold,
    updated_at = excluded.updated_at;

create or replace function public.add_product_sale_total()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_id is not null then
    insert into public.product_sales_totals (product_id, units_sold, updated_at)
    values (new.product_id, new.quantity, now())
    on conflict (product_id) do update
    set units_sold = public.product_sales_totals.units_sold + excluded.units_sold,
        updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_add_product_sale_total on public.order_items;
create trigger order_items_add_product_sale_total
after insert on public.order_items
for each row execute function public.add_product_sale_total();

create or replace function public.remove_order_after_archive(
  p_order_id bigint,
  p_finalized_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.order_items
  where order_id = p_order_id;

  delete from public.orders
  where id = p_order_id
    and finalized_at = p_finalized_at
    and status in ('rejected', 'cancelled_by_customer');

  if not found then
    raise exception 'Order % was not removed because it changed before archiving', p_order_id;
  end if;
end;
$$;

revoke all on function public.remove_order_after_archive(bigint, timestamptz)
  from public, anon, authenticated;
