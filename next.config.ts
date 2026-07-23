import type { NextConfig } from "next";

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
            value: "max-age=31536000",
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
            key: "new",
            value: "1",
          },
        ],
        destination:
          "/new-arrivals",
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