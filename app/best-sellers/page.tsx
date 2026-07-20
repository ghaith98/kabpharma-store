import type { Metadata } from "next";

import { rankBestSellerProductIds } from "@/lib/best-sellers";
import { SITE_URL } from "@/lib/site";
import { supabase } from "@/lib/supabase";

import NewArrivalsBanner from "../NewArrivalsBanner";
import NewArrivalsCollection from "../new-arrivals/NewArrivalsCollection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "الأكثر مبيعاً | KAB Pharma",

  description:
    "اكتشف منتجات KAB Pharma الأكثر مبيعاً والمفضلة للعناية بالبشرة والشعر والجسم.",

  alternates: {
    canonical: `${SITE_URL}/best-sellers`,
  },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/best-sellers`,
    siteName: "KAB Pharma",
    locale: "ar_SY",
    alternateLocale: ["en_US"],
    title: "الأكثر مبيعاً | KAB Pharma",
    description:
      "تصفّح منتجات KAB Pharma الأكثر طلباً والمفضلة لدى عملائنا.",
    images: [
      {
        url: `${SITE_URL}/opengraph-image.jpg`,
        width: 1200,
        height: 630,
        alt: "منتجات KAB Pharma الأكثر مبيعاً",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "الأكثر مبيعاً | KAB Pharma",
    description:
      "تصفّح منتجات KAB Pharma الأكثر طلباً والمفضلة لدى عملائنا.",
    images: [`${SITE_URL}/opengraph-image.jpg`],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default async function BestSellersPage() {
  const [
    productsResult,
    orderItemsResult,
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
      .eq("is_out_of_stock", false)
      .order("id", {
        ascending: false,
      }),

    supabase
      .from("order_items")
      .select("product_id, quantity"),

    supabase
      .from("home_banners")
      .select("*")
      .in("placement", [
        "best_sellers",
        "best_sellers_discover_1",
        "best_sellers_discover_2",
      ])
      .eq("is_active", true),
  ]);

  if (
    productsResult.error ||
    orderItemsResult.error
  ) {
    console.error(
      "Failed to load Best Sellers:",
      productsResult.error ||
        orderItemsResult.error
    );

    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white px-4">
        <section className="w-full max-w-xl rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center">
          <h1 className="text-2xl font-extrabold text-[#142019]">
            تعذر تحميل المنتجات الأكثر مبيعاً
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#647168]">
            يرجى تحديث الصفحة والمحاولة مرة أخرى.
          </p>
        </section>
      </main>
    );
  }

  if (bannersResult.error) {
    console.error(
      "Failed to load Best Sellers banners:",
      bannersResult.error
    );
  }

  const availableProducts =
    productsResult.data || [];

  const availableProductIds =
    new Set(
      availableProducts.map((product) =>
        Number(product.id)
      )
    );

  const rankedProductIds =
    rankBestSellerProductIds(
      orderItemsResult.data || [],
      availableProductIds
    );

  const productsById =
    new Map(
      availableProducts.map((product) => [
        Number(product.id),
        product,
      ])
    );

  const products = rankedProductIds
    .map((productId) =>
      productsById.get(productId)
    )
    .filter(
      (
        product
      ): product is (typeof availableProducts)[number] =>
        Boolean(product)
    );

  const banners =
    bannersResult.data || [];

  const heroBanner =
    banners.find(
      (banner) =>
        banner.placement ===
        "best_sellers"
    ) || null;

  const discoveryBanners =
    banners.filter(
      (banner) =>
        banner.placement ===
          "best_sellers_discover_1" ||
        banner.placement ===
          "best_sellers_discover_2"
    );

  const itemListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "KAB Pharma Best Sellers",
    numberOfItems: products.length,
    itemListElement: products.map(
      (product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/products/${product.id}`,
        name:
          product.name_ar ||
          product.name_en ||
          product.name ||
          `KAB Pharma product ${product.id}`,
      })
    ),
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            itemListData
          ).replace(/</g, "\\u003c"),
        }}
      />

      {heroBanner && (
        <NewArrivalsBanner
          banner={heroBanner}
          pageType="best-sellers"
        />
      )}

      <NewArrivalsCollection
        products={products}
        discoveryBanners={
          discoveryBanners
        }
        collectionType="best-sellers"
        hasHero={Boolean(heroBanner)}
      />
    </main>
  );
}
