import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

import NewArrivalsBanner from "../../NewArrivalsBanner";
import NewArrivalsCollection from "../../new-arrivals/NewArrivalsCollection";

export const revalidate = 60;

type PageParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { id } = await params;

  const { data: concern } = await supabase
    .from("concerns")
    .select("name_ar, name_en, description_ar, description_en")
    .eq("id", id)
    .maybeSingle();

  const title = concern
    ? `${concern.name_ar || concern.name_en} | KAB Pharma`
    : "KAB Pharma";

  const description =
    concern?.description_ar ||
    concern?.description_en ||
    undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/needs/${id}`,
    },
  };
}

export default async function ConcernNeedPage({
  params,
}: PageParams) {
  const { id } = await params;

  const [concernResult, linksResult] = await Promise.all([
    supabase
      .from("concerns")
      .select("*")
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("product_concerns")
      .select("product_id")
      .eq("concern_id", id),
  ]);

  if (concernResult.error) {
    console.error("Failed to load concern:", concernResult.error);
  }

  const concern = concernResult.data;

  if (!concern) {
    notFound();
  }

  const productIds = (linksResult.data || [])
    .map((link) => Number(link.product_id))
    .filter((productId) => Number.isFinite(productId));

  let products: any[] = [];

  if (productIds.length > 0) {
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
      .in("id", productIds);

    if (error) {
      console.error("Failed to load concern products:", error);
    }

    products = data || [];
  }

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-16">
      <NewArrivalsBanner
        banner={{
          image_url: concern.image_url,
          image_url_mobile: concern.image_url_mobile,
          title_ar: concern.name_ar,
          title_en: concern.name_en,
          text_ar: concern.description_ar,
          text_en: concern.description_en,
          desktop_position_x: concern.desktop_position_x,
          desktop_position_y: concern.desktop_position_y,
          desktop_zoom: concern.desktop_zoom,
          mobile_position_x: concern.mobile_position_x,
          mobile_position_y: concern.mobile_position_y,
          mobile_zoom: concern.mobile_zoom,
        }}
        pageType="concern"
      />

      <NewArrivalsCollection
        products={products}
        discoveryBanners={[]}
        collectionType="concern"
        hasHero={true}
      />
    </main>
  );
}
