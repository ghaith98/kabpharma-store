"use client";

import Link from "next/link";
import ProductSwiper from "./ProductSwiper";
import HomeBannerSwiper from "./HomeBannerSwiper";
import { useLanguage } from "../context/LanguageContext";

function ProductSection({
  eyebrow,
  title,
  products,
  bestSellerIds = [],
  lang,
}: {
  eyebrow: string;
  title: string;
  products: any[];
  bestSellerIds?: number[];
  lang: "en" | "ar";
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-7 sm:py-9 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="mb-6 flex items-end justify-between gap-4 sm:mb-8"
        >
          <div className={lang === "ar" ? "text-right" : "text-left"}>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0a583b] sm:text-xs">
              {eyebrow}
            </span>

            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-[#142019] sm:text-3xl lg:text-[34px]">
              {title}
            </h2>
          </div>

          <Link
            href="/products"
            className="group flex shrink-0 items-center gap-2 pb-1 text-xs font-extrabold text-[#0a583b] transition hover:text-[#073f2c] sm:text-sm"
          >
            <span>
              {lang === "ar" ? "عرض الكل" : "View all"}
            </span>

            <span className="transition-transform group-hover:translate-x-1">
              {lang === "ar" ? "←" : "→"}
            </span>
          </Link>
        </div>

        <ProductSwiper
          products={products}
          bestSellerIds={bestSellerIds}
        />
      </div>
    </section>
  );
}

export default function HomeClient({
  newProducts,
  featuredProducts,
  topSellerProducts,
  topSellerIds,
  banners,
}: {
  newProducts: any[];
  featuredProducts: any[];
  topSellerProducts: any[];
  topSellerIds: number[];
  banners: any[];
}) {
  const { lang } = useLanguage();
  const currentLang = lang as "en" | "ar";

  const text = {
    en: {
      bestSelling: "Most loved",
      topSellers: "Bestsellers",

      new: "Just arrived",
      newArrivals: "New Arrivals",

      featured: "Selected for you",
      featuredProducts: "Featured Products",
    },

    ar: {
      bestSelling: "الأكثر طلباً",
      topSellers: "الأكثر مبيعاً",

      new: "وصل حديثاً",
      newArrivals: "منتجات جديدة",

      featured: "مختارة لكِ",
      featuredProducts: "منتجات مميزة",
    },
  };

  const t = text[currentLang];

  return (
    <main
      dir={currentLang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen overflow-hidden bg-white"
    >
      {/* Main campaign hero */}
      <section className="mx-auto max-w-[1600px] px-4 pb-2 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
        <HomeBannerSwiper banners={banners || []} />
      </section>

      {/* Bestselling products */}
      <ProductSection
        eyebrow={t.bestSelling}
        title={t.topSellers}
        products={topSellerProducts || []}
        bestSellerIds={topSellerIds || []}
        lang={currentLang}
      />

      {/* Section divider */}
      {topSellerProducts?.length > 0 &&
        newProducts?.length > 0 && (
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="h-px bg-[#edf0ed]" />
          </div>
        )}

      {/* New products */}
      <ProductSection
        eyebrow={t.new}
        title={t.newArrivals}
        products={newProducts || []}
        lang={currentLang}
      />

      {/* Section divider */}
      {newProducts?.length > 0 &&
        featuredProducts?.length > 0 && (
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="h-px bg-[#edf0ed]" />
          </div>
        )}

      {/* Featured products */}
      <ProductSection
        eyebrow={t.featured}
        title={t.featuredProducts}
        products={featuredProducts || []}
        lang={currentLang}
      />

      {/* Bottom breathing space */}
      <div className="h-10 sm:h-16" />
    </main>
  );
}