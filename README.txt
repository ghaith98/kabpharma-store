KAB Pharma — Shop by Need + Concern pages update
==================================================

STEP 1 — Run the SQL migrations (Supabase Dashboard → SQL Editor → New query)
------------------------------------------------------------------------------
Run the 3 files inside SQL_MIGRATIONS_RUN_IN_ORDER, IN THIS ORDER:
  1-concerns-migration.sql
  2-concerns-description-migration.sql
  3-concerns-images-migration.sql

(Skip any of them ONLY if you already ran that exact one before.)


STEP 2 — Copy the files into your project
------------------------------------------
Everything under the "app/" and "lib/" folders here matches your project's
folder structure exactly. Extract this zip, then copy/overwrite:

  app/CategoryShowcase.tsx              -> replace
  app/Navbar.tsx                        -> replace
  app/HomeClient.tsx                    -> replace
  app/page.tsx                          -> replace
  app/globals.css                       -> replace
  app/NewArrivalsBanner.tsx             -> replace
  app/products/ProductsClient.tsx       -> replace
  app/products/page.tsx                -> replace
  app/needs/[id]/page.tsx               -> NEW FILE (new folders: app/needs/[id]/)
  app/admin/concerns/page.tsx           -> replace (or new, if you don't have it yet)
  app/admin/AdminShell.tsx              -> replace
  app/admin-mobile/page.tsx             -> replace
  lib/category-showcase.ts              -> replace
  lib/concerns.ts                       -> replace
  next.config.ts                        -> replace (project root, next to package.json)

Easiest way: just drag the "app" and "lib" folders from this zip on top of
your project folder and confirm "replace" / "merge" when your OS asks.


STEP 3 — Restart everything
-----------------------------
  1. Stop the dev server (Ctrl+C)
  2. Delete the .next cache folder:
     Remove-Item -Recurse -Force .next
  3. npm run dev


STEP 4 — Fill in the concerns admin
-------------------------------------
Go to /admin/concerns. For each concern (Acne, Dryness, etc.) click Edit and:
  - Upload a Desktop image (ideally 1600x620 or larger, subject centered)
  - Upload a Mobile image (ideally 800x400, optional — falls back to desktop
    image if you skip it)
  - Adjust Position X / Position Y / Zoom sliders if the photo needs
    recentering — you'll see the result live on the site (refresh the page
    to check).

Each concern now opens its own fully independent page at:
  /needs/<id>
(no longer /products?ids=...). Clicking a concern tile on the homepage takes
you straight there. That page has its own hero banner (identical layout to
/new-arrivals and /best-sellers), its own Filter & Sort, and only shows
products linked to that concern — there is no "remove filter and see
everything" behavior anymore, since the page is fully self-contained.
