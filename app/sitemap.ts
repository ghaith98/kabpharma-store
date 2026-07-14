import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = "https://www.kabpharma.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products, error } = await supabase
    .from("products")
    .select("id");

  if (error) {
    console.error(
      "Failed to load products for sitemap:",
      error
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
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const productPages: MetadataRoute.Sitemap =
    (products || []).map((product) => ({
      url: `${SITE_URL}/products/${product.id}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticPages, ...productPages];
}