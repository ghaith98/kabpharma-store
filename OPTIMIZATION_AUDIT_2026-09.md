# KAB Pharma — performance & production audit (September 2026)

Before deploying: run `npm install` then `npm run check` (typecheck + lint + build).
These changes were syntax-checked but could not be compiled in the audit
environment because packages could not be installed there.

## Changes in this update

### Product images (grey frame around photos)
Cards, product gallery, cart and wishlist now fill the square edge-to-edge
(`object-cover`, white background, no padding) instead of a padded grey box.
Files: `app/products/EditorialProductCard.tsx`, `app/products/[id]/ProductGallery.tsx`,
`app/cart/page.tsx`, `app/wishlist/page.tsx`.

### Speed / slow connections / heavy page switching
| Change | Why |
| --- | --- |
| Product card links use `prefetch={false}` | Every visible card was silently downloading its product page, saturating slow connections while scrolling. |
| Removed `RoutePreloader` | It downloaded 6 pages (including the full catalog) on every visit. |
| Listings select only the columns cards use (`lib/product-queries.ts`) | Ingredients / how-to-use / warnings for every product were being shipped to every listing page. |
| `OnlinePresenceTracker` rewritten | Socket only while the tab is visible, closes after 60s hidden, no re-broadcast on focus. `NEXT_PUBLIC_ENABLE_PRESENCE=false` disables it. |
| Removed unused Fraunces font (4 weights) | Downloaded on every page, never used. |
| Routine banner uses the 60 KB WebP instead of the 1.7 MB PNG | `/products` page weight. |
| Promotions endpoint cached 60s at the CDN, client refresh every 60s | Was a database query on every page view. |

### Security fixes
| Severity | Fix |
| --- | --- |
| Critical | `/api/customer/auth/email/verify-otp`: added origin check and shared rate limits (5/email, 20/IP per 15 min). Previously the 6-digit code could be brute-forced to take over any email account. |
| High | `/api/customer/auth/email/login`: replaced per-instance in-memory limiter with the shared DB limiter (10/email, 30/IP per 15 min) + origin check. |
| High | Sham Cash: new migration `202609290001_shamcash_transaction_single_use.sql` creates a permanent ledger so one transaction number can confirm only one order (closes the double-submit race and the archive gap). API returns a clean 409 on duplicates. |
| Medium | `/api/customer/orders/shamcash-verify`: rate limited (10 per customer per 15 min) and no longer reveals a transaction's amount in error messages. |

## Actions required on your side
1. Run the duplicate check at the top of the new migration, then run the migration in Supabase.
2. Run `supabase/audit/rls_policy_audit.sql` (read-only) and review queries 2 and 3.
   Any anon/public WRITE policy, or anon READ on orders/profiles/coupons/etc., is a
   critical leak because the admin panel writes with the public key.
3. `npm run check`, deploy to a preview, click through: home, products, a brand,
   a product, cart, checkout (both payment methods), email login/signup.

## Recommended next steps (not done yet)
- Store language in a cookie instead of localStorage so pages can render on the
  server in the right language (removes the Arabic→English flash, lets About/Terms/
  Privacy/Refund become server pages with far less JavaScript).
- Paginate `/products` (currently renders the whole catalog at once).
- Split the very large client pages (checkout, cart, profile, admin products).
- Move admin writes behind server API routes instead of the browser anon client.
- Sham Cash: require the transaction to be recent (e.g. last 48h) so old
  transfers cannot be claimed.
- Remove unused dependencies `leaflet`, `react-leaflet`, `@types/leaflet`
  (run `npm uninstall` so the lockfile updates) and unused `app/CustomerServiceWidget.tsx`.
