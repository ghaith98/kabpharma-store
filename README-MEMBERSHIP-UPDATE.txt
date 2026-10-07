KAB Pharma: Account benefits + optional brands discovery banner

This archive includes all five previous UI fixes.

1. Account benefits
The homepage ends with a heading and introduction, four original illustrated cards, an automatic carousel, Create My Account (/signup), and Already have an account? Log in (/login). English and Arabic copy and direction are included. Pause/resume controls and reduced-motion preferences are supported. Benefits reflect existing favorites, order-status/history, saved checkout details on the same device, and account features. No new account benefits such as discounts or consultations are promised.

2. Optional brands banner
Position: Account benefits > brands discovery banner > existing footer.
Use Admin > Banners > Brands discovery banner (/admin/banners/brands-discovery).
Upload desktop and mobile artwork using the same image/crop controls as the top homepage banners. Default destination: /brands. New brands banners default to hidden text and hidden button; the entire image remains an accessible clickable link. Enable the two independent switches to display title/description and/or button. You can activate/deactivate the banner. No placeholder artwork has been published; the banner appears only once your artwork is uploaded and activated.

SQL for the optional banner
Run supabase/migrations/202610070001_brands_discovery_banner.sql once in your Supabase SQL Editor before saving the new banner. It adds show_text and permits the brands_discovery placement while preserving existing placement choices and banner rows. Permissions are unchanged. The script has not been executed against your database. The membership section does not require SQL.

Installation
Extract this archive. Copy the project contents over your existing project, choosing Replace. Keep your existing .env.local and deployment secrets. No dependency/package changes are required.

Validation
- TypeScript passed and lint passed for the changed/new component files.
- Component tests passed for English/Arabic content, signup/login links, carousel autoplay settings, pause/resume, reduced-motion updates, hidden banner text/button with accessible brands link, lazy banner images, and section order.
- Previous checks passed: All Products 16/32/40 manual loading; search reset; Arabic brand grid order; Bestsellers before New Arrivals.
- Production compilation and TypeScript passed using Next's webpack compiler. Page-data generation then stopped because the supplied project does not include the Supabase environment settings.
- A browser could not access the local preview in this environment. Live visual, database, image-upload, and end-to-end authentication tests remain unverified.

New/updated files for this feature
- app/HomeClient.tsx
- app/HomeBannerSwiper.tsx
- app/[lang]/page.tsx
- app/(backoffice)/admin/banners/main/page.tsx
- app/(backoffice)/admin/banners/ShowButtonToggle.tsx
- app/MembershipBenefits.tsx
- app/(backoffice)/admin/banners/CampaignBannerManager.tsx
- app/(backoffice)/admin/banners/brands-discovery/page.tsx
- supabase/migrations/202610070001_brands_discovery_banner.sql
- public/images/membership/favorites.svg
- public/images/membership/orders.svg
- public/images/membership/checkout.svg
- public/images/membership/account.svg
