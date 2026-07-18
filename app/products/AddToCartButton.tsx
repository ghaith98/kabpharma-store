"use client";

import { useState } from "react";

import { addToCart } from "@/lib/cart";

import { useLanguage } from "../../context/LanguageContext";

type ProductVariant = {
  id: number | string;
  price: number | string;

  label_ar?: string | null;
  label_en?: string | null;

  name_ar?: string | null;
  name_en?: string | null;

  label?: string | null;
  name?: string | null;

  images?: string[] | null;
};

type Product = {
  id: number;
  name: string;

  price: number;
  original_price?: number;
  sale_percent?: number;

  image_url: string | null;
};

export default function AddToCartButton({
  product,
  productVariants = [],
  selectedVariantId = null,
  disabled = false,
}: {
  product: Product;
  productVariants?: ProductVariant[];
  selectedVariantId?: number | string | null;
  disabled?: boolean;
}) {
  const { lang } = useLanguage();

  const [added, setAdded] =
    useState(false);

  function handleAdd() {
    if (disabled) {
      return;
    }

    const selectedVariant =
      selectedVariantId != null
        ? productVariants.find(
            (variant) =>
              String(variant.id) ===
              String(selectedVariantId)
          ) || null
        : null;

    /*
      إذا لم يصل selectedVariantId،
      نستخدم أرخص variant كخيار احتياطي.
    */
    const fallbackVariant =
      [...productVariants].sort(
        (first, second) =>
          Number(first.price) -
          Number(second.price)
      )[0] || null;

    const finalVariant =
      selectedVariant ||
      fallbackVariant;

    const variantLabelAr =
      finalVariant
        ? finalVariant.label_ar ||
          finalVariant.name_ar ||
          finalVariant.label ||
          finalVariant.name ||
          finalVariant.label_en ||
          finalVariant.name_en ||
          null
        : null;

    const variantLabelEn =
      finalVariant
        ? finalVariant.label_en ||
          finalVariant.name_en ||
          finalVariant.label ||
          finalVariant.name ||
          finalVariant.label_ar ||
          finalVariant.name_ar ||
          null
        : null;

    const selectedLabel =
      lang === "ar"
        ? variantLabelAr
        : variantLabelEn;

    const salePercent = Math.min(
      100,
      Math.max(
        0,
        Number(
          product.sale_percent || 0
        )
      )
    );

    const variantOriginalPrice =
      finalVariant
        ? Number(finalVariant.price)
        : Number(
            product.original_price ??
              product.price
          );

    const finalPrice =
      finalVariant
        ? salePercent > 0
          ? variantOriginalPrice *
            (1 -
              salePercent / 100)
          : variantOriginalPrice
        : Number(product.price);

    addToCart({
      id: product.id,

      name: selectedLabel
        ? `${product.name} - ${selectedLabel}`
        : product.name,

      product_name: product.name,

      price: Math.round(finalPrice),

      original_price:
        variantOriginalPrice,

      sale_percent:
        salePercent,

      image_url:
        finalVariant?.images?.[0] ||
        product.image_url,

      variant_id:
        finalVariant?.id != null
          ? Number(finalVariant.id)
          : null,

      variant_label_ar:
        variantLabelAr,

      variant_label_en:
        variantLabelEn,
    });

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className={`w-full rounded-2xl py-3 font-semibold transition duration-300 ${
        disabled
          ? "cursor-not-allowed bg-[#f1f3f1] text-[#98a099]"
          : added
            ? "bg-green-50 text-green-700 ring-1 ring-green-600"
            : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {disabled
        ? lang === "ar"
          ? "غير متوفر"
          : "Out of stock"
        : added
          ? lang === "ar"
            ? "✓ تمت الإضافة"
            : "✓ Added"
          : lang === "ar"
            ? "أضف إلى السلة"
            : "Add to Cart"}
    </button>
  );
}