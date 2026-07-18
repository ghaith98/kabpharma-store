import type {
  Metadata,
} from "next";

import { supabase } from "@/lib/supabase";

import NewArrivalsBanner from "../NewArrivalsBanner";
import NewArrivalsCollection from "./NewArrivalsCollection";

const SITE_URL =
  "https://www.kabpharma.com";

export const revalidate = 60;

export const metadata: Metadata = {
  title:
    "وصل حديثاً | KAB Pharma",

  description:
    "اكتشف أحدث منتجات KAB Pharma للعناية بالبشرة والشعر والجسم.",

  alternates: {
    canonical:
      `${SITE_URL}/new-arrivals`,
  },

  openGraph: {
    type: "website",

    url:
      `${SITE_URL}/new-arrivals`,

    siteName:
      "KAB Pharma",

    locale:
      "ar_SY",

    alternateLocale: [
      "en_US",
    ],

    title:
      "وصل حديثاً | KAB Pharma",

    description:
      "اكتشف أحدث منتجات KAB Pharma للعناية بالبشرة والشعر والجسم.",

    images: [
      {
        url:
          `${SITE_URL}/opengraph-image.jpg`,

        width: 1200,
        height: 630,

        alt:
          "منتجات KAB Pharma الجديدة",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "وصل حديثاً | KAB Pharma",

    description:
      "اكتشف أحدث منتجات KAB Pharma.",

    images: [
      `${SITE_URL}/opengraph-image.jpg`,
    ],
  },
};

export default async function NewArrivalsPage() {
  const [
    productsResult,
    bannersResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name,
          name_ar,
          name_en
        ),
        product_variants (
          *
        )
      `)
      .eq(
        "is_new_arrival",
        true
      )
      .order("id", {
        ascending: false,
      }),

    supabase
      .from("home_banners")
      .select("*")
      .in(
        "placement",
        [
          "new_arrivals",
          "new_arrivals_discover_1",
          "new_arrivals_discover_2",
        ]
      )
      .eq(
        "is_active",
        true
      ),
  ]);

  if (
    productsResult.error
  ) {
    console.error(
      "Failed to load New Arrivals:",
      productsResult.error
    );

    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white px-4">
        <section className="w-full max-w-xl rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-2xl font-extrabold text-[#142019]">
            تعذر تحميل المنتجات
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#647168]">
            يرجى تحديث الصفحة والمحاولة مرة أخرى.
          </p>
        </section>
      </main>
    );
  }

  if (
    bannersResult.error
  ) {
    console.error(
      "Failed to load New Arrivals banners:",
      bannersResult.error
    );
  }

  const products =
    productsResult.data || [];

  const banners =
    bannersResult.data || [];

  const heroBanner =
    banners.find(
      (banner) =>
        banner.placement ===
        "new_arrivals"
    ) || null;

  const discoveryBanners =
    banners.filter(
      (banner) =>
        banner.placement ===
          "new_arrivals_discover_1" ||
        banner.placement ===
          "new_arrivals_discover_2"
    );

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      {heroBanner && (
        <NewArrivalsBanner
          banner={
            heroBanner
          }
        />
      )}

      <NewArrivalsCollection
        products={products}
        discoveryBanners={
          discoveryBanners
        }
      />
    </main>
  );
}