KAB Pharma: Refined account benefits

Includes all previous UI fixes and the optional brands-banner editor.

This revision
- White section, tighter spacing and shorter copy to match the supplied desktop/mobile references more closely.
- Smaller cards: 280px wide with 58px illustrations on mobile; 380px with 72px illustrations on larger screens.
- Seamless linear movement. No pause/play control and no dwell between cards. Desktop hover pauses immediately (minimum 768px width, hover-capable fine pointer). Touch devices do not pause the strip.
- Two equal card groups loop continuously; duplicate content is hidden from screen readers. The operating system reduced-motion preference remains supported.
- The signup promotion appears only after /api/customer/me confirms a guest. It stays hidden while checking and for authenticated customers. Focus, page-return and account storage changes trigger a fresh check. A signed-out customer can still see the login/signup promotion; a previously registered but signed-out visitor cannot be identified as authenticated.
- Layout order remains: existing homepage products/content > guest account benefits > optional brands discovery banner > existing footer. The brands banner stays visible independently of the membership section.

Installation
Extract and copy the project contents over your existing project, choosing Replace. Keep your .env.local and deployment secrets. No new SQL or dependency changes are required for this revision.

Optional brands banner
The existing setup is preserved: Admin > Banners > Brands discovery banner. Upload and activate your desktop/mobile artwork; destination defaults to /brands. Text/button switches are independent and default to hidden. Run supabase/migrations/202610070001_brands_discovery_banner.sql once if you have not already run it for the previous update. Do not repeat it solely for this refinement.

Validation
TypeScript and focused lint passed. Component tests passed for guest/member visibility, hidden initial session state, delayed session verification, English/Arabic content, account refresh on focus/storage/page return, cleanup, and failure handling. Continuous movement and desktop-only hover rules were checked in CSS. Animation and visual appearance have not been verified in a live browser. Live Supabase validation remains untested without your environment settings.

Changed files for this revision
- app/MembershipBenefits.tsx
- app/globals.css

Account-link refinement: gap below signup button reduced to 8px on mobile/desktop; entire login sentence is underlined and clickable in both languages. No additional SQL.
