# Shop by Need upgrade

This package includes the complete professional Shop by Need upgrade.

## What changed

- Every concern now opens as a standalone page at `/shop-by-need/[id]`.
- Standalone concern pages show only the concern hero and assigned products.
- Filter controls, filter chips, and removable concern tags are not rendered.
- Legacy `/products?concern=...` links automatically redirect to the standalone page.
- The admin dashboard now manages three fully independent images:
  - Homepage tile: **800 × 800 px**
  - Desktop page banner: **1600 × 620 px**
  - Mobile page banner: **800 × 400 px**
- The admin validates all three image dimensions before uploading.
- A new concern appears on the customer homepage immediately, even before products are linked.
- Existing concerns can replace the homepage tile and both page banners independently from Edit.
- Shop by Need pages are included in the sitemap and have independent SEO metadata.

## Required installation steps

1. Replace the project files with the files in this package.
2. Open the Supabase SQL Editor.
3. Run `SUPABASE_SHOP_BY_NEED_UPGRADE.sql`.
4. Deploy the updated project.
5. Open **Admin → Concerns → Edit** and set the independent homepage
   tile plus desktop and mobile page banners for each existing concern.

The SQL migration is safe to run more than once because it uses
`add column if not exists` and preserves existing images as fallbacks.
