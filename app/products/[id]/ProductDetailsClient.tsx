"use client";

import {
  useMemo,
  useState,
} from "react";

import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
import ProductGallery from "./ProductGallery";
import ShareProductButton from "./ShareProductButton";
import WishlistButton from "../WishlistButton";

import { useLanguage } from "../../../context/LanguageContext";

type ProductCategory = {
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

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

  categories?:
    | ProductCategory
    | null;
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

  is_out_of_stock?:
    | boolean
    | null;

  stock_quantity?:
    | number
    | string
    | null;

  stock?:
    | number
    | string
    | null;
};

function isVariantOutOfStock(
  variant: ProductDetailVariant
) {
  if (
    variant.is_out_of_stock ===
    true
  ) {
    return true;
  }

  if (
    variant.stock_quantity != null
  ) {
    return (
      Number(
        variant.stock_quantity
      ) <= 0
    );
  }

  if (variant.stock != null) {
    return (
      Number(variant.stock) <= 0
    );
  }

  return false;
}

function getVariantLabel(
  variant: ProductDetailVariant,
  isArabic: boolean
) {
  if (isArabic) {
    return (
      variant.label_ar ||
      variant.name_ar ||
      variant.label ||
      variant.name ||
      variant.label_en ||
      variant.name_en ||
      ""
    );
  }

  return (
    variant.label_en ||
    variant.name_en ||
    variant.label ||
    variant.name ||
    variant.label_ar ||
    variant.name_ar ||
    ""
  );
}

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
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const sortedVariants =
    useMemo(() => {
      return [
        ...(productVariants || []),
      ].sort(
        (
          first,
          second
        ) =>
          Number(first.price) -
          Number(second.price)
      );
    }, [productVariants]);

  const defaultVariant =
    useMemo(() => {
      return (
        sortedVariants.find(
          (variant) =>
            !isVariantOutOfStock(
              variant
            )
        ) ||
        sortedVariants[0] ||
        null
      );
    }, [sortedVariants]);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState<
    number | string | null
  >(
    defaultVariant?.id ??
      null
  );

  const selectedVariant =
    sortedVariants.find(
      (variant) =>
        String(variant.id) ===
        String(
          selectedVariantId
        )
    ) ||
    defaultVariant ||
    null;

  const productName =
    (
      isArabic
        ? product.name_ar ||
          product.name ||
          product.name_en
        : product.name_en ||
          product.name ||
          product.name_ar
    ) ||
    (
      isArabic
        ? "منتج كاب فارما"
        : "KAB Pharma product"
    );

  const productDescription =
    (
      isArabic
        ? product.description_ar ||
          product.description ||
          product.description_en
        : product.description_en ||
          product.description ||
          product.description_ar
    ) || "";

  const categoryName =
    (
      isArabic
        ? product.categories
            ?.name_ar ||
          product.categories
            ?.name ||
          product.categories
            ?.name_en
        : product.categories
            ?.name_en ||
          product.categories
            ?.name ||
          product.categories
            ?.name_ar
    ) || "";

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
    isArabic
      ? selectedVariantLabelAr
      : selectedVariantLabelEn;

  const selectedVariantImages =
    selectedVariant?.images ||
    [];

  const galleryImages =
    selectedVariantImages.length >
    0
      ? selectedVariantImages
      : normalGalleryImages;

  const originalPrice =
    selectedVariant
      ? Number(
          selectedVariant.price
        )
      : Number(
          product.price || 0
        );

  const safeSalePercent =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          salePercent || 0
        )
      )
    );

  const finalPrice =
    safeSalePercent > 0
      ? originalPrice *
        (
          1 -
          safeSalePercent / 100
        )
      : originalPrice;

  const finalImage =
    galleryImages[0] ||
    product.image_url ||
    null;

  const isOutOfStock =
    Boolean(
      product.is_out_of_stock
    ) ||
    Boolean(
      selectedVariant &&
        isVariantOutOfStock(
          selectedVariant
        )
    );

  return (
    <div className="grid items-start gap-2 sm:gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12 xl:gap-16">
      {/* Gallery + mobile actions */}
      <div className="-mx-4 min-w-0 sm:-mx-6 md:mx-0">
        <ProductGallery
          key={
            galleryImages.join(
              "|"
            )
          }
          images={
            galleryImages
          }
          productName={
            productName
          }
          backLabel={
            isArabic
              ? "العودة إلى المنتجات"
              : "Back to products"
          }
        />

        <div
          dir="ltr"
          className="flex min-h-10 items-center justify-between gap-3 px-4 pt-3 sm:px-6 md:justify-end md:px-0"
        >
          {/* Mobile category */}
          {categoryName ? (
            <p
              dir={
                isArabic
                  ? "rtl"
                  : "ltr"
              }
              className={`text-[10px] font-bold text-[#0a583b] md:hidden ${
                isArabic
                  ? "tracking-normal"
                  : "uppercase tracking-[0.16em]"
              }`}
            >
              {categoryName}
            </p>
          ) : (
            <span className="md:hidden" />
          )}

          {/* Share + favorite */}
          <div className="flex items-center gap-2">
            <div className="[&_button]:!flex [&_button]:!h-10 [&_button]:!w-10 [&_button]:!items-center [&_button]:!justify-center [&_button]:!rounded-none [&_button]:!border [&_button]:!border-[#dfe4e0] [&_button]:!bg-white [&_button]:!p-0 [&_button]:!text-[0px] [&_button]:!text-[#526057] [&_button]:!shadow-none [&_button]:hover:!border-[#0a583b] [&_button]:hover:!text-[#0a583b] [&_button_span]:!hidden [&_svg]:!h-[17px] [&_svg]:!w-[17px]">
              <ShareProductButton
                productId={
                  product.id
                }
                productNameAr={
                  product.name_ar ||
                  null
                }
                productNameEn={
                  product.name_en ||
                  null
                }
                fallbackName={
                  product.name ||
                  productName
                }
              />
            </div>

            <div className="[&_button]:!flex [&_button]:!h-10 [&_button]:!w-10 [&_button]:!items-center [&_button]:!justify-center [&_button]:!rounded-none [&_button]:!border [&_button]:!border-[#dfe4e0] [&_button]:!bg-white [&_button]:!p-0 [&_button]:!text-[#526057] [&_button]:!shadow-none [&_button]:hover:!border-[#0a583b] [&_button]:hover:!bg-white [&_button]:hover:!text-[#0a583b] [&_svg]:!h-[17px] [&_svg]:!w-[17px]">
              <WishlistButton
                product={{
                  id:
                    product.id,

                  name:
                    productName,

                  price:
                    Math.round(
                      finalPrice
                    ),

                  original_price:
                    originalPrice,

                  sale_percent:
                    safeSalePercent,

                  image_url:
                    finalImage ||
                    "",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product information */}
      <aside
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className={`lg:sticky lg:top-[104px] ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        {/* Desktop category */}
        {categoryName && (
          <p
            className={`hidden text-[10px] font-bold text-[#0a583b] sm:text-[11px] md:block ${
              isArabic
                ? "tracking-normal"
                : "uppercase tracking-[0.16em]"
            }`}
          >
            {categoryName}
          </p>
        )}

        <h1
          className={`${
            categoryName
              ? "md:mt-3"
              : ""
          } break-words text-[28px] font-semibold text-[#142019] sm:text-4xl lg:text-[42px] ${
            isArabic
              ? "leading-[1.35] tracking-normal [font-family:var(--font-arabic)]"
              : "leading-[1.1] tracking-[-0.035em]"
          }`}
        >
          {productName}
        </h1>

        {productDescription && (
          <p
            className={`mt-4 whitespace-pre-line text-sm text-[#536158] sm:text-[15px] ${
              isArabic
                ? "leading-7 [font-family:var(--font-arabic)]"
                : "leading-7"
            }`}
          >
            {
              productDescription
            }
          </p>
        )}

        {/* Variants */}
        {sortedVariants.length >
          0 && (
          <section className="mt-6 border-t border-[#dedfdd] pt-5">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-[#142019]">
                {isArabic
                  ? "اختاري الحجم"
                  : "Choose a size"}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {sortedVariants.map(
                (
                  variant,
                  index
                ) => {
                  const label =
                    getVariantLabel(
                      variant,
                      isArabic
                    ) ||
                    `Variant ${
                      index + 1
                    }`;

                  const selected =
                    String(
                      variant.id
                    ) ===
                    String(
                      selectedVariant
                        ?.id
                    );

                  const unavailable =
                    isVariantOutOfStock(
                      variant
                    );

                  return (
                    <button
                      key={
                        variant.id
                      }
                      type="button"
                      disabled={
                        unavailable
                      }
                      aria-pressed={
                        selected
                      }
                      onClick={() =>
                        setSelectedVariantId(
                          variant.id
                        )
                      }
                      className={`border-b pb-1.5 text-sm transition ${
                        selected
                          ? "border-[#142019] font-semibold text-[#142019]"
                          : "border-transparent text-[#536158] hover:border-[#9ba29d] hover:text-[#142019]"
                      } ${
                        unavailable
                          ? "cursor-not-allowed opacity-35 line-through"
                          : ""
                      }`}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

        <ProductDetailsAddToCart
          product={{
            id:
              product.id,

            name:
              selectedVariantLabel
                ? `${productName} - ${selectedVariantLabel}`
                : productName,

            product_name:
              productName,

            price:
              Math.round(
                finalPrice
              ),

            original_price:
              originalPrice,

            sale_percent:
              safeSalePercent,

            image_url:
              finalImage,

            variant_id:
              selectedVariant?.id !=
              null
                ? Number(
                    selectedVariant.id
                  )
                : null,

            variant_label_ar:
              selectedVariantLabelAr ||
              null,

            variant_label_en:
              selectedVariantLabelEn ||
              null,
          }}
          finalPrice={
            finalPrice
          }
          originalPrice={
            originalPrice
          }
          salePercent={
            safeSalePercent
          }
          selectedVariant={
            selectedVariant
          }
          disabled={
            isOutOfStock
          }
        />
      </aside>
    </div>
  );
}