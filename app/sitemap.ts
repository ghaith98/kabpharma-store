import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, concernsResult] = await Promise.all([
    supabase.from("products").select("id"),
    supabase.from("concerns").select("id"),
  ]);

  if (productsResult.error) {
    console.error(
      "Failed to load products for sitemap:",
      productsResult.error
    );
  }

  if (concernsResult.error) {
    console.error(
      "Failed to load Shop by Need pages for sitemap:",
      concernsResult.error
    );
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/new-arrivals`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/best-sellers`,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const productPages: MetadataRoute.Sitemap =
    (productsResult.data || []).map((product) => ({
      url: `${SITE_URL}/products/${product.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const concernPages: MetadataRoute.Sitemap =
    (concernsResult.data || []).map((concern) => ({
      url: `${SITE_URL}/shop-by-need/${concern.id}`,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

  return [...staticPages, ...productPages, ...concernPages];
}
