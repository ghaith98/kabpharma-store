import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import { PRODUCT_LIST_SELECT } from "@/lib/product-queries";
import BrandCollectionClient from "@/app/brands/[slug]/BrandCollectionClient";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

// Pre-build every brand page and cache it (refreshed every 60s), instead of
// rendering it from scratch on each visit. New brands still work: they are
// rendered on first visit and then cached the same way.
export async function generateStaticParams() {
  const { data } = await supabase.from("brands").select("slug");
  return (data || [])
    .map((brand) => String(brand.slug || ""))
    .filter((slug) => slug && slug !== "kab-pharma")
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: brand } = await supabase.from("brands").select("name, name_en, description_en").eq("slug", slug).maybeSingle();
  if (!brand) return {};
  const name = brand.name_en || brand.name;
  return { title: `${name} | KAB Pharma`, description: brand.description_en || `Shop ${name} products.`, alternates: { canonical: `${SITE_URL}/brands/${slug}` } };
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === "kab-pharma") redirect("/");
  const { data: brand } = await supabase.from("brands").select("*").eq("slug", slug).maybeSingle();
  if (!brand) notFound();
  const { data: products } = await supabase.from("products").select(PRODUCT_LIST_SELECT).eq("brand_id", brand.id).order("id", { ascending: false });
  return <BrandCollectionClient brand={brand} brandSlug={slug} products={products || []} />;
}
