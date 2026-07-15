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
    <section className="py-7 sm:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-6 flex items-end justify-between gap-4 ${
            lang === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <div className={lang === "ar" ? "text-right" : "text-left"}>
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">
              {eyebrow}
            </span>

            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              {title}
            </h2>
          </div>

          <Link
            href="/products"
            className="shrink-0 text-sm font-extrabold text-green-700 transition hover:text-green-900"
          >
            {lang === "ar" ? "عرض الكل ←" : "View all →"}
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
      qualityFormulations: "Quality Formulations",
      qualityFormulationsText: "Reliable everyday care",

      easyOrdering: "Easy Ordering",
      easyOrderingText: "Simple and clear checkout",

      orderTracking: "Order Tracking",
      orderTrackingText: "Follow your order easily",

      new: "New",
      newArrivals: "New Arrivals",

      bestSelling: "Best Selling",
      topSellers: "Top Sellers",

      featured: "Featured",
      featuredProducts: "Featured Products",

      whyChooseUs: "Why choose us",
      whyKab: "Care you can trust",

      highQuality: "Quality Formulations",
      highQualityText:
        "Carefully selected ingredients and reliable formulations developed for everyday skincare and personal care.",

      trustedProducts: "Made for Daily Care",
      trustedProductsText:
        "Practical products designed to support real skincare and personal care needs.",

      easyOrderingTitle: "Simple Shopping",
simpleShoppingText:
  "Explore products, complete your order and track its progress through a simple shopping experience.",

      discoverProducts: "Discover our products",
      discoverProductsText:
        "Explore skincare, body care and personal care products selected for your everyday routine.",

      shopNow: "Shop now",
    },

    ar: {
      qualityFormulations: "تركيبات عالية الجودة",
      qualityFormulationsText: "عناية موثوقة للاستخدام اليومي",

      easyOrdering: "طلب سهل",
      easyOrderingText: "خطوات واضحة وبسيطة",

      orderTracking: "تتبع الطلب",
      orderTrackingText: "تابعي طلبك بسهولة",

      new: "جديد",
      newArrivals: "وصل حديثاً",

      bestSelling: "الأكثر مبيعاً",
      topSellers: "الأكثر طلباً",

      featured: "مختاراتنا",
      featuredProducts: "منتجات مميزة",

      whyChooseUs: "لماذا تختاروننا",
      whyKab: "عناية يمكنك الوثوق بها",

      highQuality: "تركيبات عالية الجودة",
      highQualityText:
        "مكونات مختارة بعناية وتركيبات موثوقة للعناية اليومية بالبشرة والجسم.",

      trustedProducts: "مصممة للعناية اليومية",
      trustedProductsText:
        "منتجات عملية مصممة لتناسب احتياجات حقيقية للعناية بالبشرة والجسم.",

      easyOrderingTitle: "تجربة تسوق سهلة",
simpleShoppingText:
  "تصفحي المنتجات، أكملي طلبك وتابعي حالته من خلال تجربة تسوق واضحة وبسيطة.",
      discoverProducts: "اكتشفي منتجاتنا",
      discoverProductsText:
        "تصفحي منتجات العناية بالبشرة والجسم والمختارة لتناسب روتينك اليومي.",

      shopNow: "تسوقي الآن",
    },
  };

  const t = text[currentLang];

  const benefits = [
    {
      icon: "✓",
      title: t.qualityFormulations,
      description: t.qualityFormulationsText,
    },
    {
      icon: "◇",
      title: t.easyOrdering,
      description: t.easyOrderingText,
    },
    {
      icon: "↗",
      title: t.orderTracking,
      description: t.orderTrackingText,
    },
  ];

  const trustCards = [
    {
      icon: "✓",
      title: t.highQuality,
      description: t.highQualityText,
    },
    {
      icon: "✦",
      title: t.trustedProducts,
      description: t.trustedProductsText,
    },
    {
  icon: "→",
  title: t.easyOrderingTitle,
  description: t.simpleShoppingText,
},
  ];

  return (
    <main
      dir={currentLang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen overflow-hidden bg-[#fafbfa]"
    >
      {/* Main banner */}
      <section className="mx-auto max-w-[1440px] px-4 pb-5 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
        <HomeBannerSwiper banners={banners || []} />
      </section>

      {/* Benefits strip */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`flex min-w-0 flex-col items-center justify-center gap-2 px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-6 sm:py-5 ${
                index !== benefits.length - 1
                  ? currentLang === "ar"
                    ? "border-l border-gray-100"
                    : "border-r border-gray-100"
                  : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-base font-extrabold text-green-700 sm:h-10 sm:w-10">
                {benefit.icon}
              </span>

              <div
                className={
                  currentLang === "ar"
                    ? "sm:text-right"
                    : "sm:text-left"
                }
              >
                <p className="text-[11px] font-extrabold leading-4 text-gray-900 sm:text-sm">
                  {benefit.title}
                </p>

                <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New products */}
      <ProductSection
        eyebrow={t.new}
        title={t.newArrivals}
        products={newProducts || []}
        lang={currentLang}
      />

      {/* Top sellers */}
      <ProductSection
        eyebrow={t.bestSelling}
        title={t.topSellers}
        products={topSellerProducts || []}
        bestSellerIds={topSellerIds || []}
        lang={currentLang}
      />

      {/* Promotional section */}
      <section className="py-5 sm:py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#083d2b] px-6 py-8 text-white shadow-lg shadow-green-950/10 sm:px-10 sm:py-10 lg:px-14">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />
            <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-emerald-200/10 blur-3xl" />

            <div className="relative flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-green-200">
                  KAB Pharma
                </p>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {t.discoverProducts}
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-green-50/80 sm:text-base">
                  {t.discoverProductsText}
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-[#083d2b] shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50"
              >
                {t.shopNow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <ProductSection
        eyebrow={t.featured}
        title={t.featuredProducts}
        products={featuredProducts || []}
        lang={currentLang}
      />

      {/* Why KAB Pharma */}
      <section className="pb-16 pt-8 sm:pb-20 sm:pt-12">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div
            className={`mb-8 ${
              currentLang === "ar" ? "text-right" : "text-left"
            }`}
          >
            <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-700">
              {t.whyChooseUs}
            </span>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
              {t.whyKab}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trustCards.map((card) => (
              <article
                key={card.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-100 hover:shadow-lg hover:shadow-green-950/5 sm:p-7"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-lg font-extrabold text-green-700 transition group-hover:bg-green-700 group-hover:text-white">
                  {card.icon}
                </div>

                <h3 className="text-lg font-extrabold text-gray-950">
                  {card.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}