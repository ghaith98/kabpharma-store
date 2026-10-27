-- MAIN Supabase project. Apply before deploying the matching code.
begin;
alter table public.orders
  add column if not exists delivery_handler_type text,
  add column if not exists delivery_handler_id text,
  add column if not exists delivery_handler_name text,
  add column if not exists delivery_claimed_at timestamptz;

-- A saved legacy driver_name is evidence of a driver claim. Never guess
-- that older unlabelled orders belonged to an admin or a delivery company.
update public.orders o set
  delivery_handler_type = 'driver',
  delivery_handler_name = o.driver_name,
  delivery_handler_id = (select min(d.id::text) from public.delivery_drivers d
    where d.name = o.driver_name having count(*) = 1),
  delivery_claimed_at = coalesce(o.accepted_at, o.created_at)
where o.delivery_handler_type is null and nullif(trim(o.driver_name), '') is not null
  and o.status in ('out_for_delivery', 'delivered', 'rejected', 'cancelled_by_customer');

create index if not exists orders_delivery_handler_status_idx
  on public.orders(delivery_handler_type, delivery_handler_id, status);

-- Private, payload-free change counter for visible staff/admin screens.
-- It avoids repeatedly downloading unchanged order lists or exposing customer
-- details through anonymous realtime subscriptions.
create table if not exists public.order_feed_revision (
  id smallint primary key check(id = 1),
  revision bigint not null default 0
);
insert into public.order_feed_revision(id) values(1) on conflict(id) do nothing;
alter table public.order_feed_revision enable row level security;
revoke all on public.order_feed_revision from public, anon, authenticated;
grant select, insert, update, delete on public.order_feed_revision to service_role;

create or replace function public.bump_order_feed_revision()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.order_feed_revision set revision = revision + 1 where id = 1;
  return null;
end;
$$;
revoke all on function public.bump_order_feed_revision() from public, anon, authenticated;
drop trigger if exists orders_bump_feed_revision on public.orders;
create trigger orders_bump_feed_revision after insert or update or delete on public.orders
  for each statement execute function public.bump_order_feed_revision();

notify pgrst, 'reload schema';
commit;
