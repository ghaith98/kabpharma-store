"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ProductsClient from "@/app/products/ProductsClient";
import type { EditorialProduct } from "@/app/products/EditorialProductCard";
import type { DiscoveryBanner } from "@/app/new-arrivals/NewArrivalsCollection";

type Brand = {
  name: string; name_ar?: string | null; name_en?: string | null;
  description_ar?: string | null; description_en?: string | null;
  banner_image_url?: string | null; banner_image_url_mobile?: string | null;
  side_banner_image_url?: string | null; side_banner_image_url_mobile?: string | null;
};

export default function BrandCollectionClient({ brand, products }: { brand: Brand; products: EditorialProduct[] }) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const title = isArabic ? brand.name_ar || brand.name : brand.name_en || brand.name;
  const description = isArabic ? brand.description_ar || brand.description_en : brand.description_en || brand.description_ar;
  const hero = brand.banner_image_url;
  const mobileHero = brand.banner_image_url_mobile || hero;
  const side = brand.side_banner_image_url;
  const mobileSide = brand.side_banner_image_url_mobile || side;
  const collectionDiscoveryBanner: DiscoveryBanner | null = side
    ? {
        id: 0,
        placement: "brand_discovery",
        image_url: side,
        image_url_mobile: mobileSide || null,
        title: brand.name,
        title_ar: brand.name_ar || null,
        title_en: brand.name_en || null,
        text: null,
        text_ar: brand.description_ar || null,
        text_en: brand.description_en || null,
        button_text: null,
        button_text_ar: null,
        button_text_en: null,
        link_url: "#brand-products",
      }
    : null;

  return <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-hidden bg-white pb-24">
    <section className="relative isolate min-h-[360px] overflow-hidden bg-[#e8f0ea] sm:min-h-[470px]">
      {hero && <picture><source media="(max-width: 767px)" srcSet={mobileHero || hero} /><img src={hero} alt={title} className="absolute inset-0 -z-10 h-full w-full object-cover" /></picture>}
      <div className={`absolute inset-0 -z-[5] ${hero ? "bg-gradient-to-r from-[#071e13]/70 via-[#071e13]/25 to-transparent" : "bg-gradient-to-br from-[#0a583b] to-[#b7d4bf]"}`} />
      <div className="mx-auto flex min-h-[360px] max-w-[1440px] items-end px-4 py-10 sm:min-h-[470px] sm:px-6 lg:px-8 lg:py-14">
        <div className="max-w-xl text-white"><Link href="/brands" className="text-xs font-bold text-white/80 hover:text-white">{isArabic ? "العلامات التجارية" : "Brands"}</Link><h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-6xl">{title}</h1>{description && <p className="mt-4 max-w-lg text-base leading-7 text-white/90 sm:text-lg">{description}</p>}</div>
      </div>
    </section>
    <section id="brand-products" className="pt-5"><div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"><h2 className="text-2xl font-extrabold text-[#142019] sm:text-3xl">{isArabic ? "المنتجات" : "Products"}</h2></div><ProductsClient products={products} showSearch={false} showCategories={false} showHeader={false} standaloneCollection collectionDiscoveryBanner={collectionDiscoveryBanner} /></section>
  </main>;
}
