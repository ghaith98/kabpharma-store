"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { trackBrandView } from "@/lib/analytics";
import ProductsClient from "@/app/products/ProductsClient";
import type { EditorialProduct } from "@/app/products/EditorialProductCard";
import type { DiscoveryBanner } from "@/app/new-arrivals/NewArrivalsCollection";
import NewArrivalsBanner from "@/app/NewArrivalsBanner";

type Brand = {
  name: string; name_ar?: string | null; name_en?: string | null;
  description_ar?: string | null; description_en?: string | null;
  banner_image_url?: string | null; banner_image_url_mobile?: string | null;
  side_banner_image_url?: string | null; side_banner_image_url_mobile?: string | null;
};

export default function BrandCollectionClient({ brand, products }: { brand: Brand; products: EditorialProduct[] }) {
  const { lang } = useLanguage();
  useEffect(() => { trackBrandView(brand.name); }, [brand.name]);
  const isArabic = lang === "ar";
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
    {hero && <NewArrivalsBanner banner={{ image_url: hero, image_url_mobile: mobileHero, title_ar: brand.name_ar || brand.name, title_en: brand.name_en || brand.name, text_ar: brand.description_ar || null, text_en: brand.description_en || null }} pageType="brand" />}
    <section id="brand-products" className="pt-5"><ProductsClient products={products} showSearch={false} showCategories={false} showHeader={false} standaloneCollection standaloneNewArrivalsLayout collectionDiscoveryBanner={collectionDiscoveryBanner} /></section>
  </main>;
}
