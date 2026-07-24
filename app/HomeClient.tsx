"use client";

import Link from "next/link";

import ProductSwiper from "./ProductSwiper";
import HomeBannerSwiper from "./HomeBannerSwiper";
import CategoryShowcase from "./CategoryShowcase";

import type {
  HomeBanner,
} from "./HomeBannerSwiper";

import type {
  ProductCardProduct,
} from "./products/ProductCard";

import type {
  ConcernWithProducts,
} from "@/lib/concerns";

import { useLanguage } from "../context/LanguageContext";

type ProductSectionProps = {
  title: string;

  products:
    ProductCardProduct[];

  bestSellerIds?: number[];

  lang:
    | "en"
    | "ar";

  viewAllHref?: string;
};

function ProductSection({
  title,
  products,
  bestSellerIds = [],
  lang,
  viewAllHref,
}: ProductSectionProps) {
  if (
    products.length === 0
  ) {
    return null;
  }

  return (
    <section className="py-7 sm:py-9 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div
          dir={
            lang === "ar"
              ? "rtl"
              : "ltr"
          }
          className="mb-6 flex items-end justify-between gap-4 sm:mb-8"
        >
          <h2
            className={`text-2xl font-extrabold text-[#142019] sm:text-3xl lg:text-[34px] ${
              lang === "ar"
                ? "tracking-normal [font-family:var(--font-arabic)]"
                : "tracking-[-0.025em]"
            }`}
          >
            {title}
          </h2>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="group flex shrink-0 items-center gap-2 pb-1 text-xs font-extrabold text-[#0a583b] transition hover:text-[#073f2c] sm:text-sm"
            >
              <span>
                {lang === "ar"
                  ? "عرض الكل"
                  : "View all"}
              </span>

              <span
                className={`transition-transform ${
                  lang === "ar"
                    ? "group-hover:-translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              >
                {lang === "ar"
                  ? "←"
                  : "→"}
              </span>
            </Link>
          )}
        </div>

        <ProductSwiper
          products={
            products
          }
          bestSellerIds={
            bestSellerIds
          }
        />
      </div>
    </section>
  );
}

type HomeClientProps = {
  newProducts:
    ProductCardProduct[];

  featuredProducts:
    ProductCardProduct[];

  topSellerProducts:
    ProductCardProduct[];

  topSellerIds: number[];

  banners: HomeBanner[];

  concerns: ConcernWithProducts[];
};

export default function HomeClient({
  newProducts,
  featuredProducts,
  topSellerProducts,
  topSellerIds,
  banners,
  concerns,
}: HomeClientProps) {
  const { lang } =
    useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const bestSellerProducts =
    topSellerProducts.length > 0
      ? topSellerProducts
      : featuredProducts.length > 0
        ? featuredProducts
        : newProducts;

  const text = {
    en: {
      topSellers:
        "Bestsellers",

      newArrivals:
        "New Arrivals",

      featuredProducts:
        "Featured Products",
    },

    ar: {
      topSellers:
        "الأكثر مبيعاً",

      newArrivals:
        "منتجات جديدة",

      featuredProducts:
        "منتجات مميزة",
    },
  };

  const t =
    text[currentLang];

  return (
    <main
      dir={
        currentLang === "ar"
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen overflow-hidden bg-white"
    >
      <HomeBannerSwiper
        banners={
          banners
        }
      />

      <ProductSection
        title={
          t.newArrivals
        }
        products={
          newProducts
        }
        lang={
          currentLang
        }
        viewAllHref="/new-arrivals"
      />

      <CategoryShowcase
        concerns={
          concerns
        }
        lang={
          currentLang
        }
      />

      {newProducts.length > 0 &&
        bestSellerProducts.length >
          0 && (
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="h-px bg-[#edf0ed]" />
          </div>
        )}

      <ProductSection
        title={
          t.topSellers
        }
        products={
          bestSellerProducts
        }
        bestSellerIds={
          topSellerIds
        }
        lang={
          currentLang
        }
        viewAllHref="/best-sellers"
      />

      <ProductSection
        title={
          t.featuredProducts
        }
        products={
          featuredProducts
        }
        lang={
          currentLang
        }
      />

      <div className="h-10 sm:h-16" />
    </main>
  );
}
