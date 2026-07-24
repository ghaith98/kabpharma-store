import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import ProductsClient from "@/app/products/ProductsClient";

export const revalidate = 60;

type ShopByNeedPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const getConcern = cache(async (id: string) =>
  supabase
    .from("concerns")
    .select(
      "id, name_ar, name_en, description_ar, description_en, image_url, banner_image_url, banner_image_url_mobile"
    )
    .eq("id", id)
    .maybeSingle()
);

export async function generateStaticParams() {
  const { data } = await supabase.from("concerns").select("id");

  return (data || []).map((concern) => ({
    id: String(concern.id),
  }));
}

export async function generateMetadata({
  params,
}: ShopByNeedPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: concern } = await getConcern(id);

  if (!concern) {
    return {
      title: "Collection not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    concern.name_ar ||
    concern.name_en ||
    "Shop by need";
  const description =
    concern.description_ar ||
    concern.description_en ||
    `منتجات KAB Pharma المختارة لـ${title}.`;
  const pageUrl = `${SITE_URL}/shop-by-need/${concern.id}`;
  const socialImage =
    concern.banner_image_url ||
    concern.image_url ||
    `${SITE_URL}/opengraph-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName: "KAB Pharma",
      locale: "ar_SY",
      alternateLocale: ["en_US"],
      title: `${title} | KAB Pharma`,
      description,
      images: [{ url: socialImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | KAB Pharma`,
      description,
      images: [socialImage],
    },
  };
}

export default async function ShopByNeedPage({
  params,
}: ShopByNeedPageProps) {
  const { id } = await params;

  const [{ data: concern, error: concernError }, linksResult] =
    await Promise.all([
      getConcern(id),
      supabase
        .from("product_concerns")
        .select("product_id")
        .eq("concern_id", id),
    ]);

  if (concernError) {
    console.error("Failed to load concern:", concernError);
  }

  if (!concern) {
    notFound();
  }

  if (linksResult.error) {
    console.error(
      "Failed to load concern products:",
      linksResult.error
    );
  }

  const productIds = (linksResult.data || [])
    .map((link) => Number(link.product_id))
    .filter((productId) => Number.isFinite(productId));

  const productsResult =
    productIds.length > 0
      ? await supabase
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
          .in("id", productIds)
          .order("id", { ascending: true })
      : { data: [], error: null };

  if (productsResult.error) {
    console.error(
      "Failed to load products for concern:",
      productsResult.error
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-16">
      <ProductsClient
        products={productsResult.data || []}
        concern={concern}
        showHeader={false}
        showSearch={false}
        showCategories={false}
        standaloneCollection
      />
    </main>
  );
}
