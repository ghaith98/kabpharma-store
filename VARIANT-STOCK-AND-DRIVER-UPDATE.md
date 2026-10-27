# Driver passwords and per-size availability

## Required installation order

1. In the MAIN Supabase project's SQL Editor, run the complete file:
   `supabase/migrations/202610280001_variant_stock_and_driver_password.sql`
2. Deploy this updated project, retaining your current `.env.local` and deployment environment variables.

Run the migration BEFORE deployment: storefront product queries now include the new main-size availability column. No new environment variables are needed. The SQL can be run again without resetting saved availability.

## Drivers

The Add Driver form, server validation and database function now accept passwords from 1 to 200 characters instead of requiring 10. A password remains required. Delivery company passwords still require 10 characters. Existing driver accounts/passwords are not changed. The migration also installs the missing `create_delivery_driver_admin` function and refreshes the schema cache, addressing the previously reported PGRST202 error.

## Product sizes

In Admin > Products, products with extra sizes now have a **Manage size availability** button. It opens a dialog with separate switches for each variant and, when present, the main size. Changes are saved immediately. A separate product-wide switch can disable every size, while retaining the individual size settings for when the product is enabled again.

For example, mark 50g out of stock and keep 100g available. The storefront disables the 50g choice and can select an available alternative by default. It only treats the full product as unavailable when its global switch is off or all purchasable sizes are unavailable. In-stock filters, product offers, cart quote validation and order submission use the explicit size flags. Main sizes use `products.is_main_size_out_of_stock`; extra sizes use `product_variants.is_out_of_stock`. Legacy quantity columns are still ignored. Editing a product preserves its extra-size availability flags.

Existing product-wide Out of Stock flags remain in place. If an old product is globally disabled, use **Enable product · keep individual size settings** in the dialog after setting the desired sizes. Public pages may take their normal cache/revalidation interval to reflect an admin change; checkout reads current availability again.

The earlier admin customer details feature is included in this complete ZIP.

## Validation

`npm run check` covers TypeScript, lint, existing checkout/coupon/session/image checks, the admin customer API tests and production build. Availability tests cover independent extra sizes, independent main sizes, all sizes unavailable, global overrides, cheapest available fallback and ignored legacy quantity fields. The migration is also exercised in local PostgreSQL (PGlite), including repeat safety, preserving existing flags, short-password validation and service-only function grants. The local SQL test stubs pgcrypto functions; it does not test bcrypt itself. The staff API tests cover short driver passwords, rejection of empty passwords, unchanged company minimum and admin authorization.

Production build uses placeholder Supabase credentials. Real production database execution, browser interaction and actual driver sign-in were not available for end-to-end verification.
