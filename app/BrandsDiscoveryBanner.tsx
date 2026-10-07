"use client";

import HomeBannerSwiper, { type HomeBanner } from "./HomeBannerSwiper";
import { useLanguage } from "@/context/LanguageContext";

export default function BrandsDiscoveryBanner({ banners }: { banners: HomeBanner[] }) {
  const { lang } = useLanguage();
  const campaigns = banners
    .filter((banner) => banner.image_url?.trim())
    .map((banner) => ({
      ...banner,
      link_url: banner.link_url || "/brands",
      title_en: banner.title_en || banner.title || banner.title_ar || "Discover our other brands",
      title_ar: banner.title_ar || banner.title || banner.title_en || "اكتشف علاماتنا التجارية",
      button_text_en: banner.button_text_en || banner.button_text || "Explore our brands",
      button_text_ar: banner.button_text_ar || banner.button_text || "اكتشف علاماتنا",
    }));

  if (campaigns.length === 0) return null;

  return (
    <section
      aria-label={lang === "ar" ? "اكتشف علاماتنا التجارية" : "Discover our other brands"}
      className="w-full bg-white"
    >
      <HomeBannerSwiper banners={campaigns} headingLevel={2} prioritizeFirst={false} />
    </section>
  );
}
