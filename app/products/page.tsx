import type { Metadata } from "next";
import { Suspense } from "react";

import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import { rankBestSellerProductIds } from "@/lib/best-sellers";

import ProductsClient from "./ProductsClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title:
    "منتجات العناية بالبشرة والشعر",

  description:
    "تصفّح منتجات KAB Pharma للعناية بالبشرة والشعر والجسم، واكتشف منتجات العناية اليومية، الكريمات، اللوشن، الشامبو ومنتجات العناية الشخصية.",

  alternates: {
    canonical:
      `${SITE_URL}/products`,
  },

  openGraph: {
    type: "website",

    url:
      `${SITE_URL}/products`,

    siteName:
      "KAB Pharma",

    locale:
      "ar_SY",

    alternateLocale: [
      "en_US",
    ],

    title:
      "منتجات العناية بالبشرة والشعر | KAB Pharma",

    description:
      "اكتشف مجموعة KAB Pharma من منتجات العناية بالبشرة والشعر والجسم واختر المنتجات المناسبة لروتينك اليومي.",

    images: [
      {
        url:
          `${SITE_URL}/opengraph-image.jpg`,

        width: 1200,
        height: 630,

        alt:
          "منتجات KAB Pharma",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

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

      "max-image-preview":
        "large",

      "max-snippet": -1,
    },
  },
};

export default async function ProductsPage() {
  const [
    productsResult,
    orderItemsResult,
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
      .order("id", {
        ascending: true,
      }),

    supabase
      .from("order_items")
      .select(
        "product_id, quantity"
      ),
  ]);

  if (productsResult.error) {
    console.error(
      "Failed to load products:",
      productsResult.error
    );

    return (
      <main className="min-h-screen bg-white px-4 py-16 sm:px-6">
        <section className="mx-auto max-w-xl rounded-[1.5rem] border border-red-100 bg-red-50/60 px-6 py-12 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-red-600">
            KAB Pharma
          </p>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#142019]">
            تعذر تحميل المنتجات
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#647168]">
            يرجى تحديث الصفحة والمحاولة مرة أخرى.
          </p>
        </section>
      </main>
    );
  }

  if (orderItemsResult.error) {
    console.error(
      "Failed to load product sales:",
      orderItemsResult.error
    );
  }

  const allProducts =
    productsResult.data || [];

  const products =
    allProducts;

  const orderItems =
    orderItemsResult.data || [];

  const availableProductIds =
    new Set(
      allProducts
        .filter(
          (product) =>
            !product.is_out_of_stock
        )
        .map((product) =>
          Number(product.id)
        )
    );

  const bestSellerIds =
    rankBestSellerProductIds(
      orderItems,
      availableProductIds
    ).slice(0, 5);

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-16">
      {products.length === 0 ? (
        <section className="mx-auto flex min-h-[65vh] max-w-xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-[1.5rem] border border-[#e7ebe8] bg-[#f7f8f6] px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-2xl text-[#0a583b]">
              +
            </div>

            <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
              KAB Pharma
            </p>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#142019]">
              لا توجد منتجات حالياً
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#647168]">
              ستتم إضافة المنتجات قريباً.
            </p>
          </div>
        </section>
      ) : (
        <Suspense
          fallback={
            <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#dfe4e0] border-t-[#0a583b]" />

              <p className="mt-5 text-sm font-bold text-[#647168]">
                جاري تحميل المنتجات...
              </p>
            </div>
          }
        >
         <ProductsClient
  products={products}
  bestSellerIds={
    bestSellerIds
  }
/>
        </Suspense>
      )}
    </main>
  );
}
