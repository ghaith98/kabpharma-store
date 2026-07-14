"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
import ProductGallery from "./ProductGallery";
import ShareProductButton from "./ShareProductButton";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductDetailsClient({
  product,
  normalGalleryImages,
  productVariants,
  salePercent,
}: {
  product: any;
  normalGalleryImages: string[];
  productVariants: any[];
  salePercent: number;
}) {
  const { lang } = useLanguage();

  const sortedVariants = useMemo(() => {
    return [...(productVariants || [])].sort(
      (a, b) =>
        Number(a.price) - Number(b.price)
    );
  }, [productVariants]);

  const [
    selectedVariant,
    setSelectedVariant,
  ] = useState<any>(null);

  useEffect(() => {
    if (sortedVariants.length > 0) {
      setSelectedVariant(
        sortedVariants[0]
      );
    } else {
      setSelectedVariant(null);
    }
  }, [sortedVariants]);

  const productName =
    lang === "ar"
      ? product.name_ar || product.name
      : product.name_en || product.name;

  const productDescription =
    lang === "ar"
      ? product.description_ar ||
        product.description
      : product.description_en ||
        product.description;

  const selectedVariantLabel =
    selectedVariant &&
    (lang === "ar"
      ? selectedVariant.label_ar ||
        selectedVariant.label_en
      : selectedVariant.label_en ||
        selectedVariant.label_ar);

  const galleryImages =
    selectedVariant?.images?.length > 0
      ? selectedVariant.images
      : normalGalleryImages;

  const originalPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.price);

  const finalPrice =
    salePercent > 0
      ? originalPrice -
        originalPrice *
          (salePercent / 100)
      : originalPrice;

  const finalImage =
    galleryImages[0] ||
    product.image_url;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery
        images={galleryImages}
        productName={productName}
      />

      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        className={
          lang === "ar"
            ? "text-right"
            : "text-left"
        }
      >
        {/* Product title and share button */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 flex-1 break-words text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
            {productName}
          </h1>

          <ShareProductButton
            productId={product.id}
            productName={productName}
            variantLabel={
              selectedVariantLabel || null
            }
            lang={lang}
          />
        </div>

        <p className="mt-6 whitespace-pre-line leading-8 text-gray-700">
          {productDescription}
        </p>

        {sortedVariants.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-extrabold text-gray-900">
              {lang === "ar"
                ? "اختاري الحجم"
                : "Choose Size"}
            </h3>

            <div className="flex flex-wrap gap-3">
              {sortedVariants.map(
                (variant: any) => {
                  const variantLabel =
                    lang === "ar"
                      ? variant.label_ar ||
                        variant.label_en
                      : variant.label_en ||
                        variant.label_ar;

                  const isSelected =
                    selectedVariant?.id ===
                    variant.id;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() =>
                        setSelectedVariant(
                          variant
                        )
                      }
                      className={`rounded-2xl border px-4 py-3 font-extrabold transition ${
                        isSelected
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
                      }`}
                    >
                      {variantLabel}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {product.is_out_of_stock ? (
          <>
            <div className="mt-6">
              {salePercent > 0 && (
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white">
                    -{salePercent}%
                  </span>

                  <span className="text-lg font-bold text-gray-400 line-through">
                    {originalPrice.toLocaleString()}{" "}
                    SYP
                  </span>
                </div>
              )}

              <p className="text-3xl font-extrabold text-green-700">
                {Math.round(
                  finalPrice
                ).toLocaleString()}{" "}
                SYP
              </p>
            </div>

            <button
              disabled
              className="mt-8 w-full cursor-not-allowed rounded-2xl bg-gray-200 py-3 font-semibold text-gray-500"
            >
              {lang === "ar"
                ? "غير متوفر"
                : "Out of Stock"}
            </button>
          </>
        ) : (
          <ProductDetailsAddToCart
            product={{
              id: product.id,

              name: selectedVariantLabel
                ? `${productName} - ${selectedVariantLabel}`
                : productName,

              product_name: productName,

              price:
                Math.round(finalPrice),

              original_price:
                originalPrice,

              sale_percent:
                salePercent,

              image_url:
                finalImage,

              variant_id:
                selectedVariant?.id ||
                null,

              variant_label_ar:
                selectedVariant?.label_ar ||
                null,

              variant_label_en:
                selectedVariant?.label_en ||
                null,
            }}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            salePercent={salePercent}
            selectedVariant={
              selectedVariant
            }
          />
        )}
      </div>
    </div>
  );
}