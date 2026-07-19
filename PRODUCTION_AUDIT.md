# KAB Pharma production audit

Audit completed against the supplied source archive on 2026-07-19. This remediation intentionally makes no database-schema changes and preserves existing public routes, product data, pricing rules, and KAB Pharma visual identity.

## Important findings and implemented fixes

| Priority | Root cause | Production impact | Remediation |
| --- | --- | --- | --- |
| Critical | Checkout uploaded proofs and inserted orders/items directly from the browser while trusting localStorage prices, quantities, variants, fees, and customer details. | Price/fee tampering, invalid variants, unauthorized orders, inconsistent records. | Added a signed-session server checkout API that validates the customer, product and variant availability, quantities, authoritative prices/discounts, delivery area/fee, free-shipping threshold, ban status, and proof file signature before writing. Failed writes clean up the uploaded proof and partial order where possible. |
| Critical | Order history, detail, and cancellation used browser-provided phone/order values and anonymous Supabase queries. | Order disclosure or cancellation if RLS was incomplete or misconfigured. | Moved list, detail, and cancellation authorization to server code using the signed customer session; cancellation is restricted to the authenticated phone and pending orders. |
| Critical | Driver and delivery-company passwords were queried in the browser and their identity was an editable localStorage value. | Credential exposure, trivial staff impersonation, unauthorized order reads and status changes. | Added rate-limited server login, signed 12-hour HttpOnly staff sessions, active-account checks, server-side order reads and guarded state transitions. Removed staff localStorage authentication and direct browser mutations. Admin lists no longer retrieve or display existing passwords. |
| High | Customer logout only deleted localStorage and left the HttpOnly session cookie active. | A user appeared logged out while their authenticated session remained valid. | Logout now calls the server, expires the cookie, clears local state, and refreshes store counters. Checkout/payment/profile revalidate the signed session through `/api/customer/me`. |
| High | The product page's `reviewsResult` was actually a related-products query. | Incorrect review UI and aggregate-rating structured data. | Restored the real `product_reviews` query and kept the separate related-products query with variants/categories. |
| High | Homepage cards omitted variants while card actions expected variant data. | Wrong base SKU or missing variant selection from featured/new/top-seller cards. | Included category and variant records in every homepage product collection. |
| High | Root metadata made the homepage canonical URL inherit into pages without overrides. | Search engines could consolidate distinct pages into the homepage. | Scoped the homepage canonical to the homepage, added route-specific policy metadata, centralized the configurable site URL, and retained product/category canonicals and product structured data. |
| Medium | Language direction was applied after hydration from localStorage. | Arabic/English layout flash and initially incorrect DOM direction. | Added a pre-hydration language/direction initializer, consistent global RTL/LTR typography, and retained runtime language switching. |
| Medium | Guest and authenticated carts used different keys without migration; malformed localStorage was trusted. | Cart disappearance after login and UI/runtime corruption from stale values. | Added validated cart/wishlist parsing, quantity limits, safe persistence, and guest-cart merge on login/signup. |
| Medium | Navigation had no consistent delayed transition feedback and several overlays did not contain keyboard focus. | Perceived slowness and keyboard users escaping behind dialogs. | Added delayed route progress, a skip link, visible focus states, main-content focus target, dialog semantics, Escape handling, scroll locks, focus containment, and focus restoration. |
| Medium | OTP routes had no effective application-level throttling and logged upstream response content. | Abuse/cost risk and possible sensitive logging. | Added same-origin enforcement, phone/IP attempt limits, `Retry-After`, generic errors, no-store responses, and removed provider response-body logging. |
| Medium | Realtime presence connected immediately on every public visit and produced verbose production logs. | Unnecessary startup/network work and noisy logs. | Delayed non-critical presence subscription, removed public debug logging, and retained cleanup and silent degradation. |
| Medium | The legacy `/search` experience duplicated product search and had inconsistent behavior. | Disconnected UX and duplicate crawl surface. | Permanently redirects legacy queries to the canonical products search while preserving the search term. |

Additional work includes production security headers, manifest/robots/sitemap coverage, safer error and empty states, centralized environment documentation, file-content validation for payment proofs, server-authoritative profile/order reads, clean admin image lint rationale, and reusable typecheck/check scripts.

## Verification completed

- `npm run typecheck` — passed.
- `npm run lint` — passed with zero warnings.
- `npm run build` — passed; all 50 pages and API routes compiled and generated using non-secret test configuration.
- `npm audit --omit=dev --audit-level=high` — no high or critical vulnerabilities. Two moderate PostCSS advisories are inherited through Next.js and currently have no available fix.
- Compiled-server smoke checks — homepage/products/checkout rendered; legacy search returned 308; canonical metadata, manifest, robots and security headers were present; customer/staff order APIs returned 401 without sessions; cross-origin customer/staff writes returned 403; malformed OTP/staff-login input returned 400.
- Static flow review — navigation, product cards/detail/variants/reviews, cart/wishlist, checkout/payment, customer login/signup/logout/profile/orders, driver and delivery-company authentication/operations, Arabic/English direction, loading/empty/error states, metadata, and responsive class behavior.

The archive did not contain production or staging Supabase/NABDA credentials. Therefore real product data, OTP delivery, proof upload, RLS behavior, and a complete paid order against the deployed backend could not be executed safely in this environment.

## Remaining production risks and recommended follow-up

1. **Audit Supabase RLS before launch.** No schema, migrations, policies, or grants were included. Verify deny-by-default policies for every table and storage bucket, and enforce an explicit admin role rather than relying only on a valid Supabase user. This is the most important remaining release gate.
2. **Migrate staff passwords to hashes.** Browser exposure is removed, but the existing schema still stores passwords in a comparable plaintext field. Introduce an intentional migration using Argon2id/bcrypt hashes, unique identifiers, reset/rotation, and session revocation; do not attempt this without a backup and staged account migration.
3. **Make checkout atomic and idempotent.** Move proof/order/item/stock work into a database transaction or RPC with an idempotency key. Application cleanup reduces partial writes but cannot provide full transaction guarantees. Keep payment proofs private and serve them to authorized staff with signed URLs.
4. **Define delivery-company ownership.** Current business logic lets each active delivery company see the shared delivery queue. If multiple companies should see only assigned orders, add and backfill an ownership column plus policies before changing behavior.
5. **Move aggregate ranking to SQL.** Homepage/products still read all `order_items` to rank top sellers. Replace this with an indexed view/RPC or maintained aggregate and paginate large admin/public lists.
6. **Use distributed rate limiting and observability.** Current in-memory limits are useful per instance but not global. Use a managed shared limiter, structured error monitoring, audit logs for staff/order changes, uptime checks, and Core Web Vitals collection.
7. **Run live browser QA in staging.** Use real staging data to test OTP, both languages, every breakpoint, keyboard/screen reader behavior, proof formats, concurrent stock/order changes, and Lighthouse/axe/Web Vitals. Add automated Playwright coverage for these flows.
8. **Add a nonce-based Content Security Policy.** Existing security headers are safe and non-breaking; a strict CSP should be staged because Next.js scripts, Supabase assets, and the pre-hydration language initializer need explicit allowances.
