"use client";

import type {
  ComponentProps,
} from "react";

import {
  BookOpen,
  ChevronDown,
  FlaskConical,
  TriangleAlert,
} from "lucide-react";

import RelatedProductsSwiper from "./RelatedProductsSwiper";
import ReviewsSection from "./ReviewsSection";
import { useLanguage } from "../../../context/LanguageContext";
import type {
  EditorialProduct,
} from "../EditorialProductCard";

type ProductExtra = {
  id: number;
  ingredients?: string | null;
  ingredients_ar?: string | null;
  ingredients_en?: string | null;
  how_to_use_ar?: string | null;
  how_to_use_en?: string | null;
  warnings_ar?: string | null;
  warnings_en?: string | null;
};

type ProductReviews = ComponentProps<
  typeof ReviewsSection
>["initialReviews"];

export default function ProductExtraClient({
  product,
  relatedProducts,
  reviews = [],
}: {
  product: ProductExtra;
  relatedProducts: EditorialProduct[];
  reviews?: ProductReviews;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const ingredients = isArabic
    ? product.ingredients_ar ||
      product.ingredients ||
      product.ingredients_en
    : product.ingredients_en ||
      product.ingredients ||
      product.ingredients_ar;

  const howToUse = (
    isArabic ? product.how_to_use_ar : product.how_to_use_en
  )?.trim();

  const warnings = (
    isArabic ? product.warnings_ar : product.warnings_en
  )?.trim();

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="mt-10 sm:mt-14"
    >
      {ingredients && (
        <section className="border-y border-[#dedfdd]">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 sm:py-6">
              <div className="flex items-center gap-3">
                <FlaskConical
                  size={19}
                  className="text-[#0a583b]"
                />

                <h2 className="text-base font-semibold text-[#142019] sm:text-lg">
                  {isArabic
                    ? "المكونات"
                    : "Ingredients"}
                </h2>
              </div>

              <ChevronDown
                size={19}
                className="text-[#647168] transition group-open:rotate-180"
              />
            </summary>

            <div
              className={`max-w-3xl pb-6 text-sm text-[#536158] sm:text-[15px] ${
                isArabic
                  ? "text-right leading-7 [font-family:var(--font-arabic)]"
                  : "text-left leading-7"
              }`}
            >
              <p className="whitespace-pre-line">
                {ingredients}
              </p>
            </div>
          </details>

          {howToUse && (
            <details className="group border-t border-[#dedfdd]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 sm:py-6">
                <div className="flex items-center gap-3">
                  <BookOpen size={19} className="text-[#0a583b]" />

                  <h2 className="text-base font-semibold text-[#142019] sm:text-lg">
                    {isArabic ? "طريقة الاستخدام" : "How to Use"}
                  </h2>
                </div>

                <ChevronDown
                  size={19}
                  className="text-[#647168] transition group-open:rotate-180"
                />
              </summary>

              <div
                className={`max-w-3xl pb-6 text-sm text-[#536158] sm:text-[15px] ${
                  isArabic
                    ? "text-right leading-7 [font-family:var(--font-arabic)]"
                    : "text-left leading-7"
                }`}
              >
                <p className="whitespace-pre-line">{howToUse}</p>
              </div>
            </details>
          )}

          {warnings && (
            <details className="group border-t border-[#dedfdd]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 sm:py-6">
                <div className="flex items-center gap-3">
                  <TriangleAlert size={19} className="text-[#0a583b]" />

                  <h2 className="text-base font-semibold text-[#142019] sm:text-lg">
                    {isArabic ? "التحذيرات" : "Warnings"}
                  </h2>
                </div>

                <ChevronDown
                  size={19}
                  className="text-[#647168] transition group-open:rotate-180"
                />
              </summary>

              <div
                className={`max-w-3xl pb-6 text-sm text-[#536158] sm:text-[15px] ${
                  isArabic
                    ? "text-right leading-7 [font-family:var(--font-arabic)]"
                    : "text-left leading-7"
                }`}
              >
                <p className="whitespace-pre-line">{warnings}</p>
              </div>
            </details>
          )}
        </section>
      )}

      {!ingredients && (howToUse || warnings) && (
        <section className="border-y border-[#dedfdd]">
          {howToUse && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 sm:py-6">
                <div className="flex items-center gap-3">
                  <BookOpen size={19} className="text-[#0a583b]" />
                  <h2 className="text-base font-semibold text-[#142019] sm:text-lg">
                    {isArabic ? "طريقة الاستخدام" : "How to Use"}
                  </h2>
                </div>
                <ChevronDown
                  size={19}
                  className="text-[#647168] transition group-open:rotate-180"
                />
              </summary>
              <div
                className={`max-w-3xl pb-6 text-sm text-[#536158] sm:text-[15px] ${
                  isArabic
                    ? "text-right leading-7 [font-family:var(--font-arabic)]"
                    : "text-left leading-7"
                }`}
              >
                <p className="whitespace-pre-line">{howToUse}</p>
              </div>
            </details>
          )}

          {warnings && (
            <details
              className={`group ${howToUse ? "border-t border-[#dedfdd]" : ""}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 sm:py-6">
                <div className="flex items-center gap-3">
                  <TriangleAlert size={19} className="text-[#0a583b]" />
                  <h2 className="text-base font-semibold text-[#142019] sm:text-lg">
                    {isArabic ? "التحذيرات" : "Warnings"}
                  </h2>
                </div>
                <ChevronDown
                  size={19}
                  className="text-[#647168] transition group-open:rotate-180"
                />
              </summary>
              <div
                className={`max-w-3xl pb-6 text-sm text-[#536158] sm:text-[15px] ${
                  isArabic
                    ? "text-right leading-7 [font-family:var(--font-arabic)]"
                    : "text-left leading-7"
                }`}
              >
                <p className="whitespace-pre-line">{warnings}</p>
              </div>
            </details>
          )}
        </section>
      )}

      <ReviewsSection
        productId={product.id}
        initialReviews={reviews || []}
      />

      {relatedProducts?.length > 0 && (
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="mt-12 sm:mt-16"
        >
          <div className="mb-6 sm:mb-7">
            <p
              className={`text-[10px] font-bold text-[#0a583b] sm:text-[11px] ${
                isArabic
                  ? "tracking-normal [font-family:var(--font-arabic)]"
                  : "uppercase tracking-[0.16em]"
              }`}
            >
              {isArabic
                ? "مختارة لك"
                : "Complete your routine"}
            </p>

            <h2
              className={`mt-2 text-2xl font-semibold text-[#142019] sm:text-3xl ${
                isArabic
                  ? "text-right tracking-normal [font-family:var(--font-arabic)]"
                  : "text-left tracking-[-0.025em]"
              }`}
            >
              {isArabic
                ? "قد يعجبك أيضاً"
                : "You may also like"}
            </h2>
          </div>

          <RelatedProductsSwiper
            products={relatedProducts}
          />
        </section>
      )}
    </div>
  );
}
