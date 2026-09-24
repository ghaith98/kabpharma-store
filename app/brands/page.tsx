import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";
import BrandsDirectoryClient, { type BrandDirectoryItem } from "./BrandsDirectoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Brands | KAB Pharma",
  description: "Discover the KAB Pharma, Naturezspirit and Bio Naturel collections.",
  alternates: { canonical: `${SITE_URL}/brands` },
};

export default async function BrandsPage() {
  const { data } = await supabase.from("brands").select("*").order("id");
  return <BrandsDirectoryClient brands={(data || []) as BrandDirectoryItem[]} />;
}
