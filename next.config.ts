import type { NextConfig } from "next";

// Derive the Supabase origin (and its websocket origin) so the CSP can
// allow API/storage/realtime calls without hardcoding it.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseOrigin = supabaseUrl
  ? new URL(supabaseUrl).origin
  : "";
const supabaseWs = supabaseOrigin.replace(
  /^https/,
  "wss"
);

// Next.js uses eval() for hot-reload in dev only. Allow 'unsafe-eval'
// during development so the dev server works; production stays strict.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

// Content-Security-Policy.
// NOTE: script-src/style-src keep 'unsafe-inline' because Next.js injects
// inline hydration scripts and the app has inline JSON-LD + lang/dir
// scripts. This still blocks external script injection, framing,
// base-uri hijacking and form hijacking. A nonce-based CSP (stricter, no
// 'unsafe-inline') is a larger follow-up that needs middleware + testing.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`.trim(),
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value:
              "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/search",
        has: [
          {
            type: "query",
            key: "search",
            value: "(?<query>.+)",
          },
        ],
        destination: "/products?search=:query",
        permanent: true,
      },
      {
        source: "/search",
        has: [
          {
            type: "query",
            key: "q",
            value: "(?<query>.+)",
          },
        ],
        destination: "/products?search=:query",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/products",
        permanent: true,
      },
      {
        source: "/products",
        has: [
          {
            type: "query",
            key: "concern",
            value: "(?<concernId>.+)",
          },
        ],
        destination: "/shop-by-need/:concernId",
        permanent: false,
      },
      {
        source: "/products",
        has: [
          {
            type: "query",
            key: "new",
            value: "1",
          },
        ],
        destination: "/new-arrivals",
        permanent: true,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ktlfccrcqlfoppegyoet.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;