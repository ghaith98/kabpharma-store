KAB Pharma UI update

Changes
- NaturezSpirit and BioNaturel: side banner and product order stay the same in Arabic and English. Arabic text remains RTL.
- Out-of-stock buttons use neutral gray, with darker badges.
- Bestsellers and New Arrivals swap homepage positions.
- Product sale badges increase by 2px: 9 to 11px on small screens; 10 to 12px on larger screens.
- All Products initially shows 16 products. Load More adds another 16 per click and disappears at the end. No automatic loading on All Products.

Installation
Extract this archive and copy its project contents over your existing project files, choosing Replace. Preserve your existing .env.local and deployment secrets. No SQL or dependency changes are required.

Validation
TypeScript passed. Targeted lint passed with one existing unused-variable warning. Component tests passed for 16/32/40 loading, search reset, Arabic grid order, and homepage swiper order in both languages. A live preview and end-to-end checkout were not tested; the upload does not include Supabase environment settings.

Edited files
- app/HomeClient.tsx
- app/products/AddToCartButton.tsx
- app/products/EditorialProductCard.tsx
- app/products/ProductCard.tsx
- app/products/ProductsClient.tsx
- app/products/[id]/ProductDetailsAddToCart.tsx
