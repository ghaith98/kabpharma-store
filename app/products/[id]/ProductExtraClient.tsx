"use client";

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

  const ingredients =
    lang === "ar"
      ? product.ingredients_ar || product.ingredients
      : product.ingredients_en || product.ingredients;

  return (
    <>
      {ingredients && (
        <section
          dir={lang === "ar" ? "rtl" : "ltr"}
          className={`mx-auto mt-10 max-w-4xl rounded-3xl bg-white p-8 shadow-sm ${
            lang === "ar" ? "text-right" : "text-left"
          }`}
        >
          <h2 className="mb-4 text-2xl font-extrabold text-gray-900">
            {lang === "ar" ? "المكونات" : "Ingredients"}
          </h2>

          <p className="whitespace-pre-line leading-8 text-gray-700">
            {ingredients}
          </p>
        </section>
      )}

      <section className="mx-auto max-w-4xl">
        <ReviewsSection
          productId={product.id}
          initialReviews={reviews || []}
        />
      </section>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mx-auto mt-10 max-w-4xl">
          <h2
            className={`mb-6 text-2xl font-extrabold text-gray-900 ${
              lang === "ar" ? "text-right" : "text-left"
            }`}
          >
            {lang === "ar" ? "قد يعجبك أيضاً" : "You may also like"}
          </h2>

          <RelatedProductsSwiper products={relatedProducts} />
        </section>
      )}
    </>
  );
}