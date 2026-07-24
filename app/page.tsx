import type { Metadata } from "next";

import HomeClient from "./HomeClient";

import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import { rankBestSellerProductIds } from "@/lib/best-sellers";
import { attachConcernProducts } from "@/lib/concerns";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function Home() {
  const [
    newProductsResult,
    featuredProductsResult,
    orderItemsResult,
    availableProductsResult,
    bannersResult,
    concernsResult,
    productConcernsResult,
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
      .eq("is_new_arrival", true)
      .order("id", { ascending: false })
      .limit(6),

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
      .eq("featured", true)
      .order("id", { ascending: false })
      .limit(8),

    supabase
      .from("order_items")
      .select("product_id, quantity"),

    supabase
      .from("products")
      .select("id")
      .eq("is_out_of_stock", false),

    supabase
      .from("home_banners")
      .select("*")
      .eq("placement", "main")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("concerns")
      .select("id, name_ar, name_en, image_url, sort_order")
      .order("sort_order", { ascending: true }),

    supabase
      .from("product_concerns")
      .select("concern_id, product_id"),
  ]);

  if (newProductsResult.error) {
    console.error(
      "Failed to load new products:",
      newProductsResult.error
    );
  }

  if (featuredProductsResult.error) {
    console.error(
      "Failed to load featured products:",
      featuredProductsResult.error
    );
  }

  if (orderItemsResult.error) {
    console.error(
      "Failed to load order items:",
      orderItemsResult.error
    );
  }

  if (availableProductsResult.error) {
    console.error(
      "Failed to load available products:",
      availableProductsResult.error
    );
  }

  if (bannersResult.error) {
    console.error(
      "Failed to load main banners:",
      bannersResult.error
    );
  }

  if (concernsResult.error) {
    console.error(
      "Failed to load concerns:",
      concernsResult.error
    );
  }

  if (productConcernsResult.error) {
    console.error(
      "Failed to load product concerns:",
      productConcernsResult.error
    );
  }

  const newProducts = newProductsResult.data || [];
  const featuredProducts = featuredProductsResult.data || [];
  const orderItems = orderItemsResult.data || [];
  const availableProductsForRanking = availableProductsResult.data || [];
  const banners = bannersResult.data || [];

  const concerns = attachConcernProducts(
    concernsResult.data || [],
    productConcernsResult.data || []
  );

  const availableProductIds = new Set(
    availableProductsForRanking.map((product) => Number(product.id))
  );

  const topSellerIds = rankBestSellerProductIds(
    orderItems,
    availableProductIds
  ).slice(0, 5);

  let topSellerProducts: typeof newProducts = [];

  if (topSellerIds.length > 0) {
    const { data, error } = await supabase
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
      .in("id", topSellerIds);

    if (error) {
      console.error(
        "Failed to load bestseller products:",
        error
      );
    }

    topSellerProducts = topSellerIds
      .map((id) =>
        data?.find((product) => Number(product.id) === id)
      )
      .filter(Boolean);
  }

  return (
    <HomeClient
      newProducts={newProducts}
      featuredProducts={featuredProducts}
      topSellerProducts={topSellerProducts}
      topSellerIds={topSellerIds}
      banners={banners}
      concerns={concerns}
    />
  );
}

