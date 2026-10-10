"use client";

import {
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";
import ProductPromotionNotice from "./[id]/ProductPromotionNotice";

import type {
  ProductCardProduct,
} from "./ProductCard";

import { useLanguage } from "../../context/LanguageContext";
import { buildMainOption, hasMainSize } from "@/lib/product-options";

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
    // Listings send each option's main image here (not a full gallery).
    image_url?: string | null;
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
  productHref?: string;
  headingLevel?: 2 | 3;
  imageSizes?: string;
  eagerImage?: boolean;
};

function isVariantOutOfStock(_variant: EditorialProductVariant) { return false; }

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
  productHref: productHrefOverride,
  headingLevel = 2,
  imageSizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  eagerImage = false,
}: EditorialProductCardProps) {
  const router = useRouter();
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const productHref =
    productHrefOverride ||
    `/products/${product.id}`;

  const variants = useMemo<
    EditorialProductVariant[]
  >(() => {
    const options: EditorialProductVariant[] = [
      ...(product.product_variants || []),
    ];

    // Main size + extra options: offer the main size as a choice too.
    if (options.length > 0 && hasMainSize(product)) {
      options.push(
        buildMainOption(product) as EditorialProductVariant
      );
    }

    return options.sort(
      (first, second) =>
        Number(first.price) -
        Number(second.price)
    );
  }, [product]);

  const defaultVariant =
    useMemo(() => {
      return (
        variants.find(
          (variant) =>
            !isVariantOutOfStock(variant)
        ) ||
        variants[0] ||
        null
      );
    }, [variants]);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState<
    number | string | null
  >(defaultVariant?.id ?? null);

  const selectedVariant =
    variants.find(
      (variant) =>
        String(variant.id) ===
        String(selectedVariantId)
    ) ||
    defaultVariant ||
    null;

  const productName =
    (isArabic
      ? product.name_ar ||
        product.name ||
        product.name_en
      : product.name_en ||
        product.name ||
        product.name_ar) ||
    (isArabic
      ? "منتج كاب فارما"
      : "KAB Pharma product");

  const productDescription =
    (isArabic
      ? product.description_ar ||
        product.description ||
        product.description_en
      : product.description_en ||
        product.description ||
        product.description_ar) ||
    "";

  const productSize =
    (isArabic
      ? product.size_ar || product.size_en
      : product.size_en || product.size_ar) ||
    "";

  const categoryName =
    (isArabic
      ? product.categories?.name_ar ||
        product.categories?.name ||
        product.categories?.name_en
      : product.categories?.name_en ||
        product.categories?.name ||
        product.categories?.name_ar) ||
    "";

  const salePercent = Math.min(
    100,
    Math.max(
      0,
      Number(product.sale_percent || 0)
    )
  );

  const originalPrice =
    selectedVariant
      ? Number(selectedVariant.price)
      : Number(product.price || 0);

  const finalPrice =
    salePercent > 0
      ? originalPrice *
        (1 - salePercent / 100)
      : originalPrice;

  const allVariantsOutOfStock = false;

  const isOutOfStock =
    Boolean(product.is_out_of_stock) ||
    allVariantsOutOfStock ||
    Boolean(
      selectedVariant &&
        isVariantOutOfStock(
          selectedVariant
        )
    );

  const selectedImage =
    selectedVariant?.images?.[0] ||
    selectedVariant?.image_url ||
    product.image_url ||
    null;

  const Heading =
    headingLevel === 2 ? "h2" : "h3";

  const cartProduct = {
    id: product.id,
    name: productName,
    price: Math.round(finalPrice),
    original_price: originalPrice,
    sale_percent: salePercent,
    image_url: selectedImage || "",
  };

  function selectVariant(
    variantId: string
  ) {
    const matchingVariant =
      variants.find(
        (variant) =>
          String(variant.id) ===
          variantId
      );

    if (matchingVariant) {
      setSelectedVariantId(
        matchingVariant.id
      );
    }
  }

  return (
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className="group flex h-full flex-col bg-white"
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-white">
        <Link
          href={productHref}
          prefetch={false}
          onPointerEnter={() => router.prefetch(productHref)}
          onFocus={() => router.prefetch(productHref)}
          onTouchStart={() => router.prefetch(productHref)}
          aria-label={productName}
          className="absolute inset-0 flex items-center justify-center"
        >
          {selectedImage ? (
            <Image
              src={selectedImage}
              alt={productName}
              fill
              sizes={imageSizes}
              loading={eagerImage ? "eager" : "lazy"}
              className={`object-contain transition duration-500 group-hover:scale-[1.025] ${
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
          className="absolute right-2.5 top-2.5 z-20 sm:right-4 sm:top-4 [&_button]:!h-7 [&_button]:!w-7 [&_button]:!rounded-none [&_button]:!border-0 [&_button]:!bg-transparent [&_button]:!p-1 [&_button]:!shadow-none [&_button:hover]:!bg-transparent [&_button:focus]:!bg-transparent [&_svg]:!h-4 [&_svg]:!w-4"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <WishlistButton
            product={cartProduct}
          />
        </div>

        <div className="absolute left-2.5 top-2.5 z-10 sm:left-3 sm:top-3">
          {isOutOfStock ? (
            <span className="inline-flex bg-[#4b5563] px-2 py-1 text-[9px] font-semibold text-white shadow-sm sm:px-2.5 sm:py-1.5 sm:text-[10px]">
              {isArabic
                ? "غير متوفر"
                : "Out of stock"}
            </span>
          ) : salePercent > 0 ? (
            <span className="inline-flex bg-white px-2 py-1 text-[11px] font-medium text-red-600 shadow-sm sm:px-2.5 sm:py-1.5 sm:text-[12px]">
              -{salePercent}%
            </span>
          ) : <ProductPromotionNotice productId={product.id} categoryId={product.category_id} brandId={product.brand_id} summary />}
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col pt-3 sm:pt-4 ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        {categoryName && (
          <p
            className={`text-[9px] font-bold leading-4 text-[#0a583b] sm:text-[10px] ${
              isArabic
                ? "tracking-normal"
                : "uppercase tracking-[0.12em]"
            }`}
          >
            {categoryName}
          </p>
        )}

        <Link
          href={productHref}
          prefetch={false}
          onPointerEnter={() => router.prefetch(productHref)}
          onFocus={() => router.prefetch(productHref)}
          onTouchStart={() => router.prefetch(productHref)}
          className={
            categoryName
              ? "mt-1.5 sm:mt-2"
              : ""
          }
        >
          <Heading className="line-clamp-2 min-h-[40px] text-[15px] font-medium leading-5 text-[#142019] transition group-hover:text-[#0a583b] sm:min-h-[44px] sm:text-[17px] sm:leading-[22px]">
            {productName}
          </Heading>
        </Link>

        {productDescription && (
          <p className="mt-1 line-clamp-1 min-h-[18px] text-xs leading-[18px] text-[#536158] sm:mt-1.5 sm:min-h-5 sm:text-sm sm:leading-5">
            {productDescription}
          </p>
        )}

        <div
          dir="ltr"
          className="mt-2 border-t border-[#dedfdd] pt-2 sm:mt-3 sm:pt-3"
        >
          <div className="flex items-end justify-between gap-2 sm:gap-4">
            <div className="shrink-0 text-left">
              <p
                aria-hidden={
                  salePercent <= 0
                }
                className={`mb-1 h-4 whitespace-nowrap text-[10px] leading-4 text-[#8c948e] line-through sm:text-xs ${
                  salePercent > 0
                    ? "visible"
                    : "invisible"
                }`}
              >
                {originalPrice.toLocaleString()} SYP
              </p>

              <p
                className={`whitespace-nowrap text-sm font-bold sm:text-base ${
                  salePercent > 0
                    ? "text-red-600"
                    : "text-[#0a583b]"
                }`}
              >
                {Math.round(
                  finalPrice
                ).toLocaleString()} SYP
              </p>
            </div>

            {variants.length > 0 ? (
              <>
                {/* Mobile: one compact selector with an arrow. */}
                <div className="relative min-w-0 max-w-[92px] md:hidden">
                  <select
                    aria-label={
                      isArabic
                        ? "اختيار الحجم"
                        : "Select variant"
                    }
                    value={
                      selectedVariant
                        ? String(
                            selectedVariant.id
                          )
                        : ""
                    }
                    onChange={(event) =>
                      selectVariant(
                        event.target.value
                      )
                    }
                    className="h-9 w-full appearance-none border-0 border-b border-[#142019] bg-transparent py-1 pl-1 pr-5 text-right text-xs font-semibold text-[#142019] outline-none"
                  >
                    {variants.map(
                      (variant, index) => (
                        <option
                          key={variant.id}
                          value={String(
                            variant.id
                          )}
                          disabled={
                            isVariantOutOfStock(
                              variant
                            )
                          }
                        >
                          {getVariantLabel(
                            variant,
                            isArabic
                          ) ||
                            `Variant ${
                              index + 1
                            }`}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#142019]"
                    strokeWidth={1.8}
                  />
                </div>

                {/* Desktop/tablet: variants stay next to each other. */}
                <div className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-2 md:flex">
                  {variants.map(
                    (variant, index) => {
                      const label =
                        getVariantLabel(
                          variant,
                          isArabic
                        ) ||
                        `Variant ${index + 1}`;

                      const selected =
                        String(variant.id) ===
                        String(
                          selectedVariant?.id
                        );

                      const unavailable =
                        isVariantOutOfStock(
                          variant
                        );

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={unavailable}
                          aria-pressed={selected}
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
                          <span>{label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            ) : productSize ? (
              /* Single-size product: show its size where options would be. */
              <p
                dir={isArabic ? "rtl" : "ltr"}
                className="min-w-0 truncate border-b border-[#142019] pb-1 text-[#142019]"
              >
                {productSize}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 md:mt-3 [&_button]:!min-h-11 [&_button]:!w-full [&_button]:!rounded-none [&_button]:!border-0 [&_button:not(:disabled)]:!bg-[#0a583b] [&_button]:!px-3 [&_button]:!py-2.5 [&_button]:!text-xs [&_button]:!font-extrabold [&_button:not(:disabled)]:!text-white [&_button]:!ring-0 [&_button:not(:disabled)]:hover:!bg-[#073f2c] sm:[&_button]:!text-sm [&_button:disabled]:!cursor-not-allowed [&_button:disabled]:!bg-[#e5e7eb] [&_button:disabled]:!text-[#4b5563]">
          <AddToCartButton
            product={cartProduct}
            productVariants={variants}
            selectedVariantId={
              selectedVariant?.id ?? null
            }
            disabled={isOutOfStock}
          />
        </div>
      </div>
    </article>
  );
}
