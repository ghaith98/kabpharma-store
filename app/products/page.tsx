import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import ProductsClient from "./ProductsClient";

const SITE_URL = "https://www.kabpharma.com";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "منتجات العناية بالبشرة والشعر",

  description:
    "تصفّح منتجات KAB Pharma للعناية بالبشرة والشعر والجسم، واكتشف منتجات العناية اليومية، الكريمات، اللوشن، الشامبو ومنتجات العناية الشخصية.",

  alternates: {
    canonical: `${SITE_URL}/products`,
  },

  openGraph: {
    type: "website",
    url: `${SITE_URL}/products`,
    siteName: "KAB Pharma",
    locale: "ar_SY",
    alternateLocale: ["en_US"],

    title:
      "منتجات العناية بالبشرة والشعر | KAB Pharma",

    description:
      "اكتشف مجموعة KAB Pharma من منتجات العناية بالبشرة والشعر والجسم واختر المنتجات المناسبة لروتينك اليومي.",

    images: [
      {
        url: `${SITE_URL}/opengraph-image.jpg`,
        width: 1200,
        height: 630,
        alt: "منتجات KAB Pharma",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "منتجات العناية بالبشرة والشعر | KAB Pharma",

    description:
      "تصفّح مجموعة KAB Pharma من منتجات العناية بالبشرة والشعر والجسم.",

    images: [
      `${SITE_URL}/opengraph-image.jpg`,
    ],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function ProductsPage() {
  const [
    productsResult,
    orderItemsResult,
    availableProductsResult,
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
        )
      `)
      .order("id", {
        ascending: true,
      }),

    supabase
      .from("order_items")
      .select("product_id, quantity"),

    supabase
      .from("products")
      .select("id")
      .eq("is_out_of_stock", false),
  ]);

  if (productsResult.error) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-red-50 p-8 text-center">
          <h1 className="text-xl font-extrabold text-red-700">
            تعذر تحميل المنتجات
          </h1>

          <p className="mt-3 text-red-600">
            {productsResult.error.message}
          </p>
        </div>
      </main>
    );
  }

  if (orderItemsResult.error) {
    console.error(
      "Failed to load product sales:",
      orderItemsResult.error
    );
  }

  if (availableProductsResult.error) {
    console.error(
      "Failed to load available products:",
      availableProductsResult.error
    );
  }

  const products =
    productsResult.data || [];

  const orderItems =
    orderItemsResult.data || [];

  const availableProductsForRanking =
    availableProductsResult.data || [];

  const availableProductIds = new Set(
    availableProductsForRanking.map(
      (product) => Number(product.id)
    )
  );

  const salesByProduct = orderItems.reduce(
    (
      accumulator: Record<string, number>,
      item
    ) => {
      if (!item.product_id) {
        return accumulator;
      }

      const productId = String(
        item.product_id
      );

      accumulator[productId] =
        (accumulator[productId] || 0) +
        Number(item.quantity || 0);

      return accumulator;
    },
    {}
  );

  const bestSellerIds = Object.entries(
    salesByProduct
  )
    .filter(([productId]) =>
      availableProductIds.has(
        Number(productId)
      )
    )
    .sort(
      (firstProduct, secondProduct) =>
        secondProduct[1] -
        firstProduct[1]
    )
    .slice(0, 5)
    .map(([productId]) =>
      Number(productId)
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50 to-green-50 px-4 py-10 sm:px-6 sm:py-12">
      <Image
        src="/logo.png"
        alt=""
        width={1600}
        height={1600}
        priority={false}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.04]"
      />

      {products.length === 0 ? (
        <section className="relative z-10 mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <h1 className="text-2xl font-extrabold text-gray-900">
            لا توجد منتجات حالياً
          </h1>

          <p className="mt-3 text-gray-500">
            ستتم إضافة المنتجات قريباً.
          </p>
        </section>
      ) : (
        <Suspense
          fallback={
            <div className="relative z-10 py-20 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

              <p className="mt-4 font-bold text-gray-600">
                جاري تحميل المنتجات...
              </p>
            </div>
          }
        >
          <ProductsClient
            products={products}
            bestSellerIds={bestSellerIds}
          />
        </Suspense>
      )}
    </main>
  );
}