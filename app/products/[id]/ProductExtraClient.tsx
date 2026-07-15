"use client";

import {
  ChevronDown,
  FlaskConical,
} from "lucide-react";

import RelatedProductsSwiper from "./RelatedProductsSwiper";
import ReviewsSection from "./ReviewsSection";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductExtraClient({
  product,
  relatedProducts,
  reviews = [],
}: {
  product: any;
  relatedProducts: any[];
  reviews?: any[];
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

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto mt-12 max-w-[1200px]"
    >
      {ingredients && (
        <section className="border-y border-gray-200">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6">
              <div className="flex items-center gap-3">
                <FlaskConical
                  size={20}
                  className="text-[#0a583b]"
                />

                <h2 className="text-lg font-extrabold text-gray-950 sm:text-xl">
                  {isArabic
                    ? "المكونات"
                    : "Ingredients"}
                </h2>
              </div>

              <ChevronDown
                size={20}
                className="text-gray-500 transition group-open:rotate-180"
              />
            </summary>

            <div
              className={`max-w-3xl pb-7 text-[15px] text-gray-600 ${
                isArabic
                  ? "text-right leading-7 [font-family:Tahoma,Arial,sans-serif]"
                  : "text-left leading-8"
              }`}
            >
              <p className="whitespace-pre-line">
                {ingredients}
              </p>
            </div>
          </details>
        </section>
      )}

      <section className="mt-12">
        <ReviewsSection
          productId={product.id}
          initialReviews={reviews || []}
        />
      </section>

      {relatedProducts?.length > 0 && (
  <section
    dir={isArabic ? "rtl" : "ltr"}
    className="mt-12 pt-0 sm:mt-14"
  >
    <div className="mb-7">
      <p
        className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
          isArabic
            ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
            : "tracking-[0.18em]"
        }`}
      >
        {isArabic ? "مختارة لك" : "Complete your routine"}
      </p>

      <h2
        className={`mt-2 text-2xl font-extrabold text-[#142019] sm:text-3xl ${
          isArabic
            ? "text-right tracking-normal [font-family:Tahoma,Arial,sans-serif]"
            : "text-left tracking-[-0.025em]"
        }`}
      >
        {isArabic
          ? "قد يعجبك أيضاً"
          : "You may also like"}
      </h2>
    </div>

    <RelatedProductsSwiper products={relatedProducts} />
  </section>
)}
    </div>
  );
}