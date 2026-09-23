import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import BrandCollectionClient from "./BrandCollectionClient";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

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
  const { data: products } = await supabase.from("products").select("*, categories (id, name, name_ar, name_en), product_variants (*)").eq("brand_id", brand.id).order("id", { ascending: false });
  return <BrandCollectionClient brand={brand} products={products || []} />;
}
