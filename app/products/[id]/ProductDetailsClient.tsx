"use client";

import {
  useMemo,
  useState,
} from "react";

import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
import ProductGallery from "./ProductGallery";
import { useLanguage } from "../../../context/LanguageContext";

export type ProductDetail = {
  id: number;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price?: number | string | null;
  image_url?: string | null;
  is_out_of_stock?: boolean | null;
};

export type ProductDetailVariant = {
  id: number | string;
  price: number | string;
  label?: string | null;
  label_ar?: string | null;
  label_en?: string | null;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  images?: string[] | null;
};

export default function ProductDetailsClient({
  product,
  normalGalleryImages,
  productVariants,
  salePercent,
}: {
  product: ProductDetail;
  normalGalleryImages: string[];
  productVariants: ProductDetailVariant[];
  salePercent: number;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const sortedVariants = useMemo(() => {
    return [...(productVariants || [])].sort(
      (first, second) =>
        Number(first.price) -
        Number(second.price)
    );
  }, [productVariants]);

  const [
  selectedVariantId,
  setSelectedVariantId,
] = useState<number | null>(() =>
  sortedVariants[0]?.id != null
    ? Number(sortedVariants[0].id)
    : null
);

const selectedVariant =
  useMemo(() => {
    if (
      sortedVariants.length === 0
    ) {
      return null;
    }

    const selected =
      sortedVariants.find(
        (variant) =>
          Number(variant.id) ===
          Number(selectedVariantId)
      );

    /*
      قبل تشغيل useEffect أيضاً،
      أرخص variant هو الخيار الافتراضي.
    */
    return (
      selected ||
      sortedVariants[0]
    );
  }, [
    sortedVariants,
    selectedVariantId,
  ]);

const selectedVariantLabelAr =
  selectedVariant
    ? selectedVariant.label_ar ||
      selectedVariant.name_ar ||
      selectedVariant.label ||
      selectedVariant.name ||
      selectedVariant.label_en ||
      selectedVariant.name_en
    : null;

const selectedVariantLabelEn =
  selectedVariant
    ? selectedVariant.label_en ||
      selectedVariant.name_en ||
      selectedVariant.label ||
      selectedVariant.name ||
      selectedVariant.label_ar ||
      selectedVariant.name_ar
    : null;

const selectedVariantLabel =
  lang === "ar"
    ? selectedVariantLabelAr
    : selectedVariantLabelEn;

  const productName =
    (isArabic
      ? product.name_ar || product.name || product.name_en
      : product.name_en || product.name || product.name_ar) ||
    (isArabic ? "منتج كاب فارما" : "KAB Pharma product");

  const productDescription = (isArabic
    ? product.description_ar ||
      product.description ||
      product.description_en
    : product.description_en ||
      product.description ||
      product.description_ar) || "";

  const selectedVariantImages = selectedVariant?.images || [];

  const galleryImages =
    selectedVariantImages.length > 0
      ? selectedVariantImages
      : normalGalleryImages;

  const originalPrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.price);

  const finalPrice =
    salePercent > 0
      ? originalPrice *
        (1 - salePercent / 100)
      : originalPrice;

  const finalImage =
    galleryImages[0] ||
    product.image_url ||
    null;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:gap-14">
      <ProductGallery
        key={galleryImages.join("|")}
        images={galleryImages}
        productName={productName}
      />

      <aside
        dir={isArabic ? "rtl" : "ltr"}
        className={`lg:sticky lg:top-[104px] ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
          KAB Pharma
        </p>

        <h1
          className={`mt-3 break-words text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-[44px] ${
            isArabic
              ? "leading-[1.25] tracking-normal [font-family:Tahoma,Arial,sans-serif]"
              : "leading-[1.08] tracking-[-0.035em]"
          }`}
        >
          {productName}
        </h1>

        {productDescription && (
          <p
            className={`mt-5 whitespace-pre-line text-[15px] text-[#5f6c64] ${
              isArabic
                ? "leading-7 [font-family:Tahoma,Arial,sans-serif]"
                : "leading-8"
            }`}
          >
            {productDescription}
          </p>
        )}

        {sortedVariants.length > 0 && (
          <div className="mt-7 border-t border-gray-200 pt-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-extrabold text-gray-950">
                {isArabic
                  ? "اختاري الحجم"
                  : "Choose a size"}
              </h2>

              {selectedVariantLabel && (
                <span className="text-xs font-bold text-gray-500">
                  {selectedVariantLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
             {sortedVariants.map(
  (variant) => {
    const labelAr =
      variant.label_ar ||
      variant.name_ar ||
      variant.label ||
      variant.name ||
      variant.label_en ||
      variant.name_en;

    const labelEn =
      variant.label_en ||
      variant.name_en ||
      variant.label ||
      variant.name ||
      variant.label_ar ||
      variant.name_ar;

    const label =
      isArabic
        ? labelAr
        : labelEn;

    const selected =
      Number(
        selectedVariant?.id
      ) ===
      Number(variant.id);

    return (
      <button
        key={variant.id}
        type="button"
        onClick={() =>
          setSelectedVariantId(
            Number(variant.id)
          )
        }
        className={`min-h-12 rounded-full border px-5 text-sm font-extrabold transition ${
          selected
            ? "border-[#0a583b] bg-[#0a583b] text-white"
            : "border-gray-200 bg-white text-gray-700 hover:border-[#7ea990] hover:text-[#0a583b]"
        }`}
      >
        {label}
      </button>
    );
  }
)}
            </div>
          </div>
        )}

        {product.is_out_of_stock ? (
          <div className="mt-7 border-t border-gray-200 pt-6">
            <p className="text-3xl font-extrabold text-[#0a583b]">
              {Math.round(
                finalPrice
              ).toLocaleString()}{" "}
              SYP
            </p>

            <button
              type="button"
              disabled
              className="mt-6 min-h-[54px] w-full cursor-not-allowed rounded-full bg-gray-200 px-6 font-extrabold text-gray-500"
            >
              {isArabic
                ? "غير متوفر"
                : "Out of stock"}
            </button>
          </div>
        ) : (
          <ProductDetailsAddToCart
            product={{
              id: product.id,

              name: selectedVariantLabel
                ? `${productName} - ${selectedVariantLabel}`
                : productName,

              product_name: productName,

              price: Math.round(finalPrice),

              original_price:
                originalPrice,

              sale_percent:
                salePercent,

              image_url: finalImage,

             variant_id:
  selectedVariant?.id != null
    ? Number(selectedVariant.id)
    : null,

              variant_label_ar:
  selectedVariantLabelAr ||
  null,

variant_label_en:
  selectedVariantLabelEn ||
  null,
            }}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            salePercent={salePercent}
            selectedVariant={selectedVariant}
          />
        )}
      </aside>
    </div>
  );
}
