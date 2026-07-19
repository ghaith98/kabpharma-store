import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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
          "/admin/",
          "/admin-mobile/",
          "/driver/",
          "/delivery/",
          "/delivery-company/",
          "/checkout/",
          "/payment/",
          "/orders/",
          "/profile/",
          "/cart/",
          "/wishlist/",
        ],
      },
    ],

    sitemap:
      `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}
