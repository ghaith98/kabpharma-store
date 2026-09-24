# Automatic order archive setup

This feature automatically moves only `rejected` and `cancelled_by_customer`
orders to a separate Supabase archive **90 days after the final status is
set**. Delivered orders remain in the main KAB Pharma database. It copies the
order first and removes it from the main database only after that copy succeeds.

## 1. Create the archive project

Create a second Supabase project, for example `kabpharma-archive`.

In that new project, open **SQL Editor** and run:

`supabase/archive/202609240001_archived_orders.sql`

## 2. Add the archive credentials to the deployed website

In the environment variables for the deployed KAB Pharma website, add:

```text
ARCHIVE_SUPABASE_URL=https://YOUR_ARCHIVE_PROJECT.supabase.co
ARCHIVE_SUPABASE_SERVICE_ROLE_KEY=the archive project's service_role key
ARCHIVE_CRON_SECRET=a long random secret used only for this job
```

Restart/redeploy the website after adding them. These must remain server-only:
never put them in a `NEXT_PUBLIC_` variable and never paste the service-role
key in browser code.

## 3. Prepare the main project

In the existing KAB Pharma Supabase project, run:

`supabase/migrations/202609240003_order_archiving.sql`

This also preserves all-time best-seller totals after old order items are
moved out of the main database.

## 4. Schedule the daily job

The site must be deployed to a public HTTPS URL. A job cannot call
`localhost:3000` while the computer is off.

In the **main** Supabase project, enable the `pg_cron` and `pg_net`
extensions under **Integrations**, then run the following SQL. Replace the two
placeholder values with the deployed website URL and the exact
`ARCHIVE_CRON_SECRET` used in step 2.

```sql
select vault.create_secret(
  'https://www.kabpharma.com',
  'kab_archive_site_url'
);

select vault.create_secret(
  'REPLACE_WITH_THE_SAME_ARCHIVE_CRON_SECRET',
  'kab_archive_cron_secret'
);

select cron.schedule(
  'kabpharma-archive-final-orders-daily',
  '17 02 * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'kab_archive_site_url'
      ) || '/api/internal/archive-orders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-archive-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'kab_archive_cron_secret'
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);
```

The job runs every day at 02:17 UTC and moves up to 50 eligible orders per
run. Its request goes to the website's protected server route; the archive
credentials are never sent to the browser.

## 5. Check it

After setup, open **Admin → Archived Orders**. It will show archived orders
and lets you search by order number, customer, or phone. Customers can also
continue to see and open their archived order history from **My orders**.

Supabase Cron job runs can be checked in **Integrations → Cron** in the main
project.
