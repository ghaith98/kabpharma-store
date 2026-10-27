# Admin customer details

Customers now have a name link and a View details button in `/admin/users`, on mobile and desktop. They open `/admin/users/[profile ID]`.

The page shows the customer's saved name, phone, email, registration date and purchase restriction, followed by newest-first order history. Expand each order to see its recipient, address, map link if saved, status, dates, payment method, ShamCash transaction, product names/variants/quantities/prices, promotions/free gifts, coupon, delivery/COD fees and saved total. Product and payment-proof images are not displayed or returned by the new API.

Live and configured archived orders are combined with live copies preferred during an archive retry. Load older orders retrieves the next 25 by order ID; there is no fixed lifetime order limit. An unavailable optional archive produces an explicit incomplete-history notice and leaves live orders usable. Refresh retries from the newest orders.

The API checks the existing server admin authorization before accessing customer data and sends private, no-store responses. It matches stored customer_profile_id first; older unlinked orders may match the exact phone only when placed after registration. Orders explicitly assigned to a different account are excluded. Missing registration dates disable that legacy fallback. Only allowlisted profile/order fields are returned; no password hashes, session data, idempotency keys or image URLs are exposed. Logout clears the loaded details.

## Installation

Use this updated project as usual and retain your existing `.env.local` and deployment environment variables. No new environment variables or SQL migrations are required for this feature. The existing customer/coupon schema and optional archive configuration continue to be used.

## Validation

- `npm run typecheck`
- `npm run lint`
- `npm run test:admin-customers`: mocked API tests covering unauthorized access, invalid IDs/cursors, missing profiles, explicit ownership filters, safe response fields, 120 interleaved live/archived orders across pagination, duplicate archive retry records, archive downtime and unknown ban state.
- Production build with placeholder Supabase credentials (does not verify the live database).

Actual production customer data and archive credentials were not available for an end-to-end live check.
