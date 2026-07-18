"use client";

import type {
  ComponentProps,
} from "react";

import Image from "next/image";
import Link from "next/link";

import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

import { useLanguage } from "../../context/LanguageContext";

type ProductCategory = {
  id?: number;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

type ProductVariants =
  NonNullable<
    ComponentProps<
      typeof AddToCartButton
    >["productVariants"]
  >;

export type ProductCardProduct = {
  id: number;

  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;

  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;

  price?: number | string | null;
  sale_percent?:
    | number
    | string
    | null;

  image_url?: string | null;

  is_out_of_stock?:
    | boolean
    | null;

  category_id?:
    | number
    | null;

  categories?:
    | ProductCategory
    | null;

  product_variants?:
    | ProductVariants
    | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
  variant?:
    | "standard"
    | "compact";
  headingLevel?: 2 | 3;
  imageSizes?: string;
  className?: string;
};

export default function ProductCard({
  product,
  variant = "standard",
  headingLevel = 2,
  imageSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className = "",
}: ProductCardProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const isCompact =
    variant === "compact";

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
    Number(
      product.price || 0
    );

  const finalPrice =
    salePercent > 0
      ? originalPrice -
        originalPrice *
          (salePercent / 100)
      : originalPrice;

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

  const isOutOfStock =
    Boolean(
      product.is_out_of_stock
    );

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
      product.image_url || "",
  };

  return (
    <article
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className={`group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[#e7ebe8] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#d7e5dc] hover:shadow-xl hover:shadow-[#073f2c]/[0.06] sm:rounded-[1.5rem] ${
        isCompact
          ? "min-h-[390px]"
          : "min-h-[390px] sm:min-h-[430px]"
      } ${className}`}
    >
      <div
        className={`relative shrink-0 overflow-hidden bg-[#f7f8f6] ${
          isCompact
            ? "h-[218px]"
            : "h-[185px] sm:h-[225px]"
        }`}
      >
        <Link
          href={`/products/${product.id}`}
          aria-label={
            productName
          }
          className="flex h-full w-full items-center justify-center p-3 sm:p-5"
        >
          {product.image_url ? (
            <Image
              src={
                product.image_url
              }
              alt={
                productName
              }
              width={600}
              height={600}
              sizes={
                imageSizes
              }
              className={`h-full w-full object-contain transition duration-500 group-hover:scale-[1.04] ${
                isOutOfStock
                  ? "opacity-55 grayscale-[25%]"
                  : ""
              }`}
            />
          ) : (
            <span className="text-xs font-bold text-[#99a29c] sm:text-sm">
              {isArabic
                ? "لا توجد صورة"
                : "No image"}
            </span>
          )}
        </Link>

        <div
          dir="ltr"
          className="absolute right-3 top-3 z-20"
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
            <span className="inline-flex rounded-full border border-[#dfe4e0] bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-[#526057] shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">
              {isArabic
                ? "غير متوفر"
                : "Out of stock"}
            </span>
          ) : salePercent > 0 ? (
            <span className="inline-flex rounded-full border border-red-100 bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-red-600 shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">
              -{salePercent}%
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col p-3.5 sm:p-5 ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        {!isCompact && (
          <p
            className={`min-h-4 truncate text-[9px] font-extrabold text-[#0a583b] sm:text-[10px] ${
              isArabic
                ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                : "uppercase tracking-[0.12em]"
            }`}
          >
            {categoryName ||
              "KAB Pharma"}
          </p>
        )}

        <Link
          href={`/products/${product.id}`}
          className={
            isCompact
              ? ""
              : "mt-2"
          }
        >
          <Heading
            className={`line-clamp-2 font-extrabold text-[#142019] transition group-hover:text-[#0a583b] ${
              isCompact
                ? "min-h-[48px] text-[15px] leading-6 sm:text-base"
                : "min-h-[44px] text-sm leading-[22px] sm:min-h-[48px] sm:text-base sm:leading-6"
            }`}
          >
            {productName}
          </Heading>
        </Link>

        {isCompact &&
          productDescription && (
            <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-[#647168] sm:text-sm">
              {productDescription}
            </p>
          )}

        <div className="mt-3 flex min-h-[45px] flex-col justify-end">
          <p
            className={`whitespace-nowrap text-sm font-extrabold sm:text-base ${
              salePercent > 0
                ? "text-red-600"
                : "text-[#0a583b]"
            }`}
          >
            {Math.round(
              finalPrice
            ).toLocaleString()}{" "}
            SYP
          </p>

          <p
            aria-hidden={
              salePercent <= 0
            }
            className={`mt-1 whitespace-nowrap text-[10px] font-bold text-[#99a29c] line-through sm:text-[11px] ${
              salePercent > 0
                ? "visible"
                : "invisible"
            }`}
          >
            {originalPrice.toLocaleString()}{" "}
            SYP
          </p>
        </div>

        <div className="mt-auto pt-3">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="min-h-11 w-full cursor-not-allowed rounded-full border border-[#dfe4e0] bg-[#f3f5f3] px-3 text-xs font-extrabold text-[#99a29c] sm:text-sm"
            >
              {isArabic
                ? "غير متوفر"
                : "Out of stock"}
            </button>
          ) : isCompact ? (
            <Link
              href={`/products/${product.id}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#d7e5dc] bg-white px-4 text-xs font-extrabold text-[#0a583b] transition hover:border-[#0a583b] hover:bg-[#edf5f0] sm:text-sm"
            >
              {isArabic
                ? "عرض المنتج"
                : "View product"}
            </Link>
          ) : (
            <div className="[&_button]:!min-h-11 [&_button]:!w-full [&_button]:!rounded-full [&_button]:!bg-[#0a583b] [&_button]:!px-3 [&_button]:!py-2.5 [&_button]:!text-xs [&_button]:!font-extrabold [&_button]:!text-white [&_button]:!shadow-none [&_button]:hover:!bg-[#073f2c] sm:[&_button]:!text-sm">
              <AddToCartButton
                product={
                  cartProduct
                }
                productVariants={
                  product.product_variants ||
                  []
                }
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}