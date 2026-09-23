import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Brands | KAB Pharma",
  description: "Discover the KAB Pharma, Naturezspirit and Bio Naturel collections.",
  alternates: { canonical: `${SITE_URL}/brands` },
};

type Brand = {
  id: number;
  slug: string;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  banner_image_url: string | null;
};

export default async function BrandsPage() {
  const { data } = await supabase.from("brands").select("*").order("id");
  const brands = (data || []) as Brand[];

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-4 py-12 pb-24 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1200px]">
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.2em] text-[#0a583b]">KAB Pharma</p>
        <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-[#142019] sm:text-4xl">Our Brands <span dir="rtl" className="ms-2 font-[family-name:var(--font-arabic)]">علاماتنا التجارية</span></h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {brands.map((brand) => {
            const isKabPharma = brand.slug === "kab-pharma";

            return (
            <Link key={brand.id} href={isKabPharma ? "/" : `/brands/${brand.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-[#e2e9e4] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[4/3] bg-[#eaf1ed]">
                {brand.banner_image_url ? <img src={brand.banner_image_url} alt={brand.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#dbece1] to-[#f7f4e9] text-2xl font-extrabold text-[#0a583b]">{brand.name}</div>}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-extrabold text-[#142019]">{brand.name_en || brand.name}</h2>
                <p dir="rtl" className="mt-1 text-lg font-bold text-[#0a583b] [font-family:var(--font-arabic)]">{brand.name_ar}</p>
                <p className="mt-4 text-sm leading-6 text-[#647168]">{brand.description_en || brand.description_ar}</p>
                <span className="mt-5 inline-flex text-sm font-extrabold text-[#0a583b]">{isKabPharma ? "Visit main shop →" : "Explore collection →"}</span>
              </div>
            </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
