import type { MetadataRoute } from "next";

const SITE_URL =
  "https://www.kabpharma.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        /*
          API ليست صفحات ويب ولا تحتاج فهرسة.
        */
        disallow: [
          "/api/",
        ],
      },
    ],

    sitemap:
      `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}