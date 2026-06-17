"use client";

import Image from "next/image";
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
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={`mb-8 text-center ${
            lang === "ar" ? "sm:text-right" : "sm:text-left"
          }`}
        >
          <span className="text-sm font-bold uppercase tracking-wider text-green-700">
            {eyebrow}
          </span>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>

        <ProductSwiper products={products} bestSellerIds={bestSellerIds} />
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

  const text = {
    en: {
      badge: "KAB Pharma",
      title1: "Trusted Skincare &",
      title2: "Personal Care Solutions",
      subtitle:
        "High-quality skincare and personal care products designed to support healthier, more confident everyday living.",
      shopNow: "Shop Now",
      qualityFormulations: "Quality Formulations",
      easyOrdering: "Easy Ordering",
      orderTracking: "Order Tracking",
      skincareProducts: "Skincare & Personal Care Products",
      selected: "Carefully selected for everyday care.",
      new: "New",
      newArrivals: "New Arrivals",
      bestSelling: "Best Selling",
      topSellers: "Top Sellers",
      featured: "Featured",
      featuredProducts: "Featured Products",
      whyChooseUs: "Why choose us",
      whyKab: "Why KAB Pharma?",
      highQuality: "High Quality",
      highQualityText:
        "Carefully selected ingredients and reliable formulations for daily skincare and personal care.",
      trustedProducts: "Trusted Products",
      trustedProductsText:
        "Practical products made for real everyday needs with a clear and simple shopping experience.",
      easyOrderingTitle: "Easy Ordering",
      easyOrderingText:
        "Simple checkout, payment proof upload, and order tracking after purchase.",
    },
    ar: {
      badge: "KAB Pharma",
      title1: "عناية موثوقة بالبشرة",
      title2: "ومنتجات للعناية اليومية",
      subtitle:
        "منتجات عناية بالبشرة والجسم بجودة عالية، مصممة لتناسب احتياجاتك اليومية بثقة وبساطة.",
      shopNow:" تسوق الآن",
      qualityFormulations: "تركيبات عالية الجودة",
      easyOrdering: "طلب سهل",
      orderTracking: "تتبع الطلب",
      skincareProducts: "منتجات العناية بالبشرة والجسم",
      selected: "مختارة بعناية للاستخدام اليومي.",
      new: "جديد",
      newArrivals: "وصل حديثاً",
      bestSelling: "الأكثر مبيعاً",
      topSellers: "الأكثر طلباً",
      featured: "مختاراتنا",
      featuredProducts: "منتجات مميزة",
      whyChooseUs: "لماذا تختاروننا",
      whyKab: "لماذا KAB Pharma؟",
      highQuality: "جودة عالية",
      highQualityText:
        "مكونات مختارة بعناية وتركيبات موثوقة للعناية اليومية بالبشرة والجسم.",
      trustedProducts: "منتجات موثوقة",
      trustedProductsText:
        "منتجات عملية مصممة لاحتياجات يومية حقيقية مع تجربة تسوق واضحة وسهلة.",
      easyOrderingTitle: "طلب سهل",
      easyOrderingText:
        "إتمام طلب بسيط، رفع إثبات الدفع، وإمكانية تتبع الطلب بعد الشراء.",
    },
  };

  const t = text[lang as "en" | "ar"];

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50 to-green-50">
      <section className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-120px] top-10 h-72 w-72 rounded-full bg-green-100 blur-3xl" />
          <div className="absolute right-[-120px] top-40 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        </div>

        <div className="grid items-center gap-6 rounded-[1.5rem] bg-gradient-to-b from-[#fbfefc] to-white p-5 shadow-sm ring-1 ring-gray-100 backdrop-blur md:grid-cols-2 md:gap-10 md:rounded-[2rem] md:p-10">
          <div className={lang === "ar" ? "hidden md:block md:text-right" : "hidden md:block md:text-left"}>
            <span className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-100">
              {t.badge}
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              {t.title1}
              <span className="block text-green-700">{t.title2}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 md:mx-0">
              {t.subtitle}
            </p>

            <div className={lang === "ar" ? "mt-8 flex justify-center md:justify-end" : "mt-8 flex justify-center md:justify-start"}>
              <Link
                href="/products"
                className="inline-block rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-sm transition hover:bg-green-700"
              >
                {t.shopNow}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm font-bold text-gray-700 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                {t.qualityFormulations}
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                {t.easyOrdering}
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                {t.orderTracking}
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-green-100 blur-2xl" />

            <div className="relative rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <Image
                src="/logo.png"
                alt="KAB Pharma"
                width={420}
                height={140}
                className="h-auto w-full max-w-[360px]"
                priority
              />

              <div className="mt-6 rounded-3xl bg-gradient-to-b from-green-50 to-white p-5 text-center">
                <p className="text-sm font-bold text-green-700">
                  {t.skincareProducts}
                </p>
                <p className="mt-2 text-xs text-gray-500">{t.selected}</p>
              </div>

              <Link
                href="/products"
                className="mt-6 block rounded-2xl bg-green-600 px-8 py-4 text-center font-bold text-white shadow-sm transition hover:bg-green-700 md:hidden"
              >
                {t.shopNow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <HomeBannerSwiper banners={banners || []} />
        </div>
      </section>

      <ProductSection
        eyebrow={t.new}
        title={t.newArrivals}
        products={newProducts || []}
        lang={lang}
      />

      <ProductSection
        eyebrow={t.bestSelling}
        title={t.topSellers}
        products={topSellerProducts || []}
        bestSellerIds={topSellerIds}
        lang={lang}
      />

      <ProductSection
        eyebrow={t.featured}
        title={t.featuredProducts}
        products={featuredProducts || []}
        lang={lang}
      />

      <section className="pb-16 pt-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-green-700">
              {t.whyChooseUs}
            </span>

            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              {t.whyKab}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                ✓
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {t.highQuality}
              </h3>

              <p className="leading-7 text-gray-600">{t.highQualityText}</p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                ✦
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {t.trustedProducts}
              </h3>

              <p className="leading-7 text-gray-600">
                {t.trustedProductsText}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                →
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                {t.easyOrderingTitle}
              </h3>

              <p className="leading-7 text-gray-600">{t.easyOrderingText}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}