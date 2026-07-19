# KAB Pharma Store

Production e-commerce storefront and operations dashboard for KAB Pharma, built with Next.js 16, React 19, Supabase, and Tailwind CSS.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configure every value in `.env.local` before testing authenticated or data-backed flows. Server-only keys must never be exposed through `NEXT_PUBLIC_` variables or committed to source control.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

Run all three with `npm run check`. A successful production build requires the environment variables listed in `.env.example`.

## Critical production configuration

- Enforce Row Level Security on every Supabase table and storage bucket. The service-role key is used only in server routes.
- Restrict the `payment-proofs` bucket to authorized staff if receipts contain personal or financial information.
- Use separate development, staging, and production Supabase projects and OTP credentials.
- Configure the public site URL and allowed redirect origins in the deployment platform.
- Keep database migrations, RLS policies, and a tested rollback procedure under version control before changing schema.

## Deployment smoke test

After deployment, verify both Arabic and English on mobile and desktop, then test product search/filtering, variants, cart, wishlist, OTP login/signup/logout, checkout, order history/detail/cancellation, and staff-only areas with non-production test data.
