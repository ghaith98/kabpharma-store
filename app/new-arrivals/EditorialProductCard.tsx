"use client";

import {
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "../products/AddToCartButton";
import WishlistButton from "../products/WishlistButton";

import type {
  ProductCardProduct,
} from "../products/ProductCard";

import { useLanguage } from "../../context/LanguageContext";

type BaseProductVariant =
  NonNullable<
    ProductCardProduct["product_variants"]
  >[number];

export type EditorialProductVariant =
  BaseProductVariant & {
    id: number | string;
    price: number | string;

    label_ar?: string | null;
    label_en?: string | null;

    name_ar?: string | null;
    name_en?: string | null;

    label?: string | null;
    name?: string | null;

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

export type EditorialProduct =
  Omit<
    ProductCardProduct,
    "product_variants"
  > & {
    product_variants?:
      | EditorialProductVariant[]
      | null;
  };

type EditorialProductCardProps = {
  product: EditorialProduct;
  headingLevel?: 2 | 3;
  imageSizes?: string;
};

function isVariantOutOfStock(
  variant: EditorialProductVariant
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
      Number(
        variant.stock
      ) <= 0
    );
  }

  return false;
}

function getVariantLabel(
  variant: EditorialProductVariant,
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

export default function EditorialProductCard({
  product,
  headingLevel = 2,
  imageSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: EditorialProductCardProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const variants =
    useMemo<
      EditorialProductVariant[]
    >(() => {
      return [
        ...(
          product.product_variants ||
          []
        ),
      ].sort(
        (
          first,
          second
        ) =>
          Number(first.price) -
          Number(second.price)
      );
    }, [
      product.product_variants,
    ]);

  const defaultVariant =
    useMemo(() => {
      return (
        variants.find(
          (variant) =>
            !isVariantOutOfStock(
              variant
            )
        ) ||
        variants[0] ||
        null
      );
    }, [variants]);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState<
    | number
    | string
    | null
  >(
    defaultVariant?.id ??
      null
  );

  const selectedVariant =
    variants.find(
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

  const salePercent =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          product.sale_percent ||
            0
        )
      )
    );

  const originalPrice =
    selectedVariant
      ? Number(
          selectedVariant.price
        )
      : Number(
          product.price || 0
        );

  const finalPrice =
    salePercent > 0
      ? originalPrice *
        (
          1 -
          salePercent / 100
        )
      : originalPrice;

  const variantsHaveStockData =
    variants.some(
      (variant) =>
        variant.is_out_of_stock !=
          null ||
        variant.stock_quantity !=
          null ||
        variant.stock != null
    );

  const allVariantsOutOfStock =
    variants.length > 0 &&
    variantsHaveStockData &&
    variants.every(
      isVariantOutOfStock
    );

  const isOutOfStock =
    Boolean(
      product.is_out_of_stock
    ) ||
    allVariantsOutOfStock ||
    Boolean(
      selectedVariant &&
        isVariantOutOfStock(
          selectedVariant
        )
    );

  const selectedImage =
    selectedVariant
      ?.images?.[0] ||
    product.image_url ||
    null;

  const Heading =
    headingLevel === 2
      ? "h2"
      : "h3";

  const cartProduct = {
    id: product.id,
    name: productName,

    price:
      Math.round(
        finalPrice
      ),

    original_price:
      originalPrice,

    sale_percent:
      salePercent,

    image_url:
      selectedImage || "",
  };

  return (
    <article
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="group flex h-full min-h-[530px] flex-col bg-white"
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-[#f7f7f7]">
        <Link
          href={`/products/${product.id}`}
          aria-label={
            productName
          }
          className="flex h-full w-full items-center justify-center p-5 sm:p-7"
        >
          {selectedImage ? (
            <Image
              src={
                selectedImage
              }
              alt={
                productName
              }
              width={700}
              height={700}
              sizes={
                imageSizes
              }
              className={`h-full w-full object-contain transition duration-500 group-hover:scale-[1.025] ${
                isOutOfStock
                  ? "opacity-55 grayscale-[25%]"
                  : ""
              }`}
            />
          ) : (
            <span className="text-sm font-semibold text-[#909991]">
              {isArabic
                ? "لا توجد صورة"
                : "No image"}
            </span>
          )}
        </Link>

        <div
          dir="ltr"
          className="absolute right-4 top-4 z-20 [&_button]:!h-7 [&_button]:!w-7 [&_button]:!rounded-none [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!p-1 [&_button]:!shadow-none [&_button:hover]:!bg-transparent [&_button:focus]:!bg-transparent [&_svg]:!h-4 [&_svg]:!w-4"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <WishlistButton
            product={
              cartProduct
            }
          />
        </div>

        <div className="absolute left-3 top-3 z-10">
          {isOutOfStock ? (
            <span className="inline-flex bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#526057] shadow-sm">
              {isArabic
                ? "غير متوفر"
                : "Out of stock"}
            </span>
          ) : salePercent > 0 ? (
            <span className="inline-flex bg-white px-2.5 py-1.5 text-[10px] font-medium text-red-600 shadow-sm">
              -{salePercent}%
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col pt-5 ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        <p
          className={`min-h-4 text-[10px] font-bold text-[#0a583b] ${
            isArabic
              ? "tracking-normal"
              : "uppercase tracking-[0.12em]"
          }`}
        >
          {categoryName ||
            "KAB Pharma"}
        </p>

        <Link
          href={`/products/${product.id}`}
          className="mt-3"
        >
          <Heading className="min-h-[52px] text-base font-medium leading-6 text-[#142019] transition group-hover:text-[#0a583b] sm:text-[17px]">
            {productName}
          </Heading>
        </Link>

        {productDescription && (
          <p className="mt-3 line-clamp-1 min-h-[22px] text-sm leading-[22px] text-[#536158]">
            {productDescription}
          </p>
        )}

        <div
          dir="ltr"
          className="mt-auto flex min-h-[74px] items-end justify-between gap-4 border-t border-[#dedfdd] pt-5"
        >
          <div className="shrink-0 text-left">
            <p
              className={`whitespace-nowrap text-base font-bold ${
                salePercent > 0
                  ? "text-red-600"
                  : "text-[#142019]"
              }`}
            >
              {Math.round(
                finalPrice
              ).toLocaleString()}{" "}
              SYP
            </p>

            {salePercent > 0 && (
              <p className="mt-1 text-xs text-[#8c948e] line-through">
                {originalPrice.toLocaleString()}{" "}
                SYP
              </p>
            )}
          </div>

          {variants.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
              {variants.map(
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
                      className={`border-b pb-1 text-sm transition ${
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
          )}
        </div>

        <div className="mt-5 [&_button]:!min-h-11 [&_button]:!rounded-none [&_button]:!border [&_button]:!border-[#142019] [&_button]:!bg-white [&_button]:!px-4 [&_button]:!py-2.5 [&_button]:!text-sm [&_button]:!font-medium [&_button]:!text-[#142019] [&_button]:!ring-0 [&_button]:hover:!bg-[#0a583b] [&_button]:hover:!text-white disabled:[&_button]:!border-[#dfe3df] disabled:[&_button]:!bg-[#f4f5f4] disabled:[&_button]:!text-[#9aa19c]">
          <AddToCartButton
            product={
              cartProduct
            }
            productVariants={
              variants
            }
            selectedVariantId={
              selectedVariant?.id ??
              null
            }
            disabled={
              isOutOfStock
            }
          />
        </div>
      </div>
    </article>
  );
}