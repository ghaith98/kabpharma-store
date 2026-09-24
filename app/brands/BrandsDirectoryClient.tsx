"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export type BrandDirectoryItem = {
  id: number;
  slug: string;
  name: string;
  name_ar: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  banner_image_url: string | null;
};

export default function BrandsDirectoryClient({ brands }: { brands: BrandDirectoryItem[] }) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-[#f7f8f6] px-4 py-12 pb-24 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1200px]">
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.2em] text-[#0a583b]">KAB Pharma</p>
        <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-[#142019] sm:text-4xl">{isArabic ? "علاماتنا التجارية" : "Our Brands"}</h1>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {brands.map((brand) => {
            const isKabPharma = brand.slug === "kab-pharma";
            const title = isArabic ? brand.name_ar || brand.name_en || brand.name : brand.name_en || brand.name_ar || brand.name;
            const description = isArabic ? brand.description_ar || brand.description_en : brand.description_en || brand.description_ar;

            return <Link key={brand.id} href={isKabPharma ? "/" : `/brands/${brand.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#e2e9e4] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="aspect-[4/3] bg-[#eaf1ed]">{brand.banner_image_url ? <img src={brand.banner_image_url} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#dbece1] to-[#f7f4e9] text-2xl font-extrabold text-[#0a583b]">{title}</div>}</div>
              <div className="flex flex-1 flex-col p-6"><h2 className="text-xl font-extrabold text-[#142019]">{title}</h2>{description && <p className="mt-4 text-sm leading-6 text-[#647168]">{description}</p>}<span className="mt-5 inline-flex text-sm font-extrabold text-[#0a583b] md:mt-auto md:pt-5">{isKabPharma ? (isArabic ? "زيارة المتجر ←" : "Visit main shop →") : (isArabic ? "اكتشف المجموعة ←" : "Explore collection →")}</span></div>
            </Link>;
          })}
        </div>
      </section>
    </main>
  );
}
