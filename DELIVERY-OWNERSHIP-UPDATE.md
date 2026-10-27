# Delivery ownership and automatic updates

## Install before deploying

Run `supabase/migrations/202610280002_delivery_ownership.sql` in the MAIN Supabase SQL Editor, then deploy this complete project. Retain existing environment variables and `.env.local`. If the preceding size-availability/driver-password migration `202610280001_variant_stock_and_driver_password.sql` has not been applied, run it first. No new environment variables or Realtime publication settings are required.

## Behavior

- Admin Orders displays **Driver: [name]**, **Delivery company: [name]**, or **Admin**, plus the collection time. The same details are available inside the customer's order history.
- A driver or company claim saves the authenticated account's stable ID, role, name snapshot and timestamp in the same update that changes the order from accepted to out_for_delivery. The name is never accepted from the browser request.
- Company screens show unclaimed accepted orders and that company's own in-progress/completed orders. Driver orders, admin orders and other companies' orders are excluded on the server, not only hidden by the interface.
- Completion is restricted to the matching driver/company ID and role. An old company tab cannot mark a driver's order delivered. A competing claim or stale admin action returns a conflict instead of overwriting the winner.
- The admin moving an order into out_for_delivery records Admin. Merely completing an already driver/company-owned order preserves that owner. Explicitly moving an order back to accepted/pending clears ownership and makes it claimable again when accepted.

## Automatic screen updates

Open company, driver and Admin Orders screens check a private revision counter every 5 seconds while visible. They download order lists only after a revision changes (plus initial load/resume/manual refresh). Returning to the tab or coming back online also checks for changes. Network latency, background browser suspension and connectivity affect timing; this is periodic automatic refresh, not a push/instant delivery guarantee.

There are no anonymous subscriptions exposing customer order rows. Polling is authenticated, pauses in hidden tabs, avoids overlapping polls, retries after failed loads and cleans up on unmount. Old in-flight order fetches are aborted before a user action so they cannot restore a stale claim. The company's existing online heartbeat remains active, throttled to about 30 seconds on revision checks.

A private one-row table stores the order revision. A trigger increments it on order inserts/updates/deletes. These changes do not duplicate orders. The archive's existing whole-order snapshot preserves the ownership fields automatically.

## Older orders

Existing saved driver_name values are backfilled as driver ownership. The driver ID is assigned only when that name matches exactly one driver account. Historical orders without a saved handler remain **Not recorded**: the code cannot reliably infer whether an admin or a company handled them. Unattributed old orders are not shown as a company's own deliveries. An admin can explicitly return a still-pending delivery to accepted if it needs to be claimed again; do not reopen completed historical orders merely to fill missing labels.

## Verification

`npm run test:delivery-ownership` exercises the SQL migration locally (legacy backfill, repeat safety, private grants and single revision trigger), API ownership and authorization, stale-page completion, competing claims, admin attribution, release and owner preservation. A simulated client test checks changed-only list loads, polling timing, visibility pause/resume, failed-load retries, overlapping request prevention and cleanup. `npm run check` also runs TypeScript, lint, existing regressions and the production build.

The build uses placeholder Supabase credentials. Actual production migration execution and two real devices/accounts were not available for live end-to-end verification.

This ZIP includes the earlier customer-details, per-size stock and shorter driver-password changes.
