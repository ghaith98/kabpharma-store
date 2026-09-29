-- Make every Sham Cash transaction number usable for exactly one order.
--
-- Why: the order API checks "is this transaction already used?" and then
-- inserts later. Two requests at the same moment can both pass the check,
-- so one payment could confirm two orders. Also, rejected orders are moved
-- to the archive project after 90 days, which made their transaction
-- numbers look unused again.
--
-- This keeps a permanent ledger of used transaction numbers. The ledger is
-- filled by a trigger on orders, and its primary key rejects duplicates
-- atomically, so the race and the archive gap are both closed.
--
-- BEFORE RUNNING: check for existing duplicates. If this returns rows, decide
-- which order keeps each transaction first, otherwise step 2 will fail.
--
--   select shamcash_transaction_id, count(*)
--   from public.orders
--   where shamcash_transaction_id is not null
--   group by 1 having count(*) > 1;

-- 1. Ledger table (server-only; no public access).
create table if not exists public.used_shamcash_transactions (
  transaction_id text primary key,
  order_id bigint,
  used_at timestamptz not null default now()
);

alter table public.used_shamcash_transactions enable row level security;
revoke all on public.used_shamcash_transactions from anon, authenticated;

-- 2. Backfill from existing orders.
insert into public.used_shamcash_transactions (transaction_id, order_id, used_at)
select shamcash_transaction_id, id, coalesce(created_at, now())
from public.orders
where shamcash_transaction_id is not null
on conflict (transaction_id) do nothing;

-- 3. Record every new transaction number in the same transaction as the order
--    insert. A duplicate raises unique_violation and the order is not created.
create or replace function public.record_shamcash_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.shamcash_transaction_id is not null then
    insert into public.used_shamcash_transactions (transaction_id, order_id)
    values (new.shamcash_transaction_id, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_shamcash_transaction on public.orders;
create trigger trg_record_shamcash_transaction
  after insert on public.orders
  for each row
  execute function public.record_shamcash_transaction();
