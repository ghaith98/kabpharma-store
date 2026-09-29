-- READ-ONLY. Run in the Supabase SQL editor. Changes nothing.
--
-- The admin panel writes to the database straight from the browser using
-- the public anon key, so safety depends entirely on Row Level Security.
-- The admin policy in migrations only restricts the "authenticated" role.
-- Any older policy created in the dashboard for "anon" / "public" still
-- applies to anyone on the internet.

-- 1. Tables with RLS switched OFF (anyone with the anon key has full access).
select schemaname, tablename
from pg_tables
where schemaname = 'public' and rowsecurity = false
order by tablename;

-- 2. Every policy that lets anonymous visitors WRITE.
--    Expected result for a store: ZERO rows (orders, reviews etc. are
--    created through the server API with the service role).
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  and (roles @> array['anon']::name[] or roles @> array['public']::name[])
order by tablename, policyname;

-- 3. Every policy that lets anonymous visitors READ.
--    Catalog tables (products, product_variants, categories, brands,
--    concerns, product_concerns, home_banners, product_sales_totals,
--    approved product_reviews) are fine here.
--    orders, order_items, profiles, delivery_*, coupons, coupon_usages,
--    settings with secrets, rate_limits, email_verification_codes
--    must NOT appear.
select tablename, policyname, roles, qual
from pg_policies
where schemaname = 'public'
  and cmd in ('SELECT', 'ALL')
  and (roles @> array['anon']::name[] or roles @> array['public']::name[])
order by tablename, policyname;

-- 4. Storage buckets and whether they are public.
--    The payment-proof bucket must be private (public = false).
select id, name, public from storage.buckets order by name;
