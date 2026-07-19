"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Minus,
  Plus,
} from "lucide-react";

import {
  addToCart,
  getCartItemQuantity,
  updateCartQuantity,
} from "@/lib/cart";

import type {
  CartItem,
} from "@/lib/cart";

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

  productVariants?:
    ProductVariant[];

  selectedVariantId?:
    | number
    | string
    | null;

  disabled?: boolean;
}) {
  const { lang } =
    useLanguage();

  const finalVariant =
    useMemo(() => {
      const selectedVariant =
        selectedVariantId != null
          ? productVariants.find(
              (variant) =>
                String(
                  variant.id
                ) ===
                String(
                  selectedVariantId
                )
            ) || null
          : null;

      const fallbackVariant =
        [...productVariants].sort(
          (
            first,
            second
          ) =>
            Number(
              first.price
            ) -
            Number(
              second.price
            )
        )[0] || null;

      return (
        selectedVariant ||
        fallbackVariant
      );
    }, [
      productVariants,
      selectedVariantId,
    ]);

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

  const variantOriginalPrice =
    finalVariant
      ? Number(
          finalVariant.price
        )
      : Number(
          product.original_price ??
            product.price
        );

  const finalPrice =
    finalVariant
      ? salePercent > 0
        ? variantOriginalPrice *
          (
            1 -
            salePercent / 100
          )
        : variantOriginalPrice
      : Number(product.price);

  const variantId =
    finalVariant?.id != null
      ? Number(
          finalVariant.id
        )
      : null;

  const cartItem: Omit<
    CartItem,
    "quantity"
  > = {
    id:
      product.id,

    name:
      selectedLabel
        ? `${product.name} - ${selectedLabel}`
        : product.name,

    product_name:
      product.name,

    price:
      Math.round(
        finalPrice
      ),

    original_price:
      variantOriginalPrice,

    sale_percent:
      salePercent,

    image_url:
      finalVariant
        ?.images?.[0] ||
      product.image_url,

    variant_id:
      variantId,

    variant_label_ar:
      variantLabelAr,

    variant_label_en:
      variantLabelEn,
  };

  const [
    quantity,
    setQuantity,
  ] = useState(0);

  useEffect(() => {
    function syncQuantity() {
      setQuantity(
        getCartItemQuantity(
          product.id,
          variantId
        )
      );
    }

    syncQuantity();

    window.addEventListener(
      "cartUpdated",
      syncQuantity
    );

    window.addEventListener(
      "storage",
      syncQuantity
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        syncQuantity
      );

      window.removeEventListener(
        "storage",
        syncQuantity
      );
    };
  }, [
    product.id,
    variantId,
  ]);

  function notifyCartUpdated() {
    window.dispatchEvent(
      new Event(
        "cartUpdated"
      )
    );
  }

  function handleAddOne() {
    if (disabled) {
      return;
    }

    addToCart(
      cartItem,
      1
    );

    setQuantity(
      getCartItemQuantity(
        product.id,
        variantId
      )
    );

    notifyCartUpdated();
  }

  function handleRemoveOne() {
    if (disabled) {
      return;
    }

    const currentQuantity =
      getCartItemQuantity(
        product.id,
        variantId
      );

    const nextQuantity =
      Math.max(
        0,
        currentQuantity - 1
      );

    updateCartQuantity(
      product.id,
      variantId,
      nextQuantity
    );

    setQuantity(
      nextQuantity
    );

    notifyCartUpdated();
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-none border border-[#dfe3df] bg-[#f1f3f1] px-3 py-2.5 text-xs font-extrabold text-[#98a099] sm:text-sm"
      >
        {lang === "ar"
          ? "غير متوفر"
          : "Out of stock"}
      </button>
    );
  }

  if (quantity <= 0) {
    return (
      <button
        type="button"
        onClick={
          handleAddOne
        }
        className="flex min-h-11 w-full items-center justify-center rounded-none border border-[#0a583b] bg-[#0a583b] px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#073f2c] sm:text-sm"
      >
        {lang === "ar"
          ? "أضف إلى السلة"
          : "Add to Cart"}
      </button>
    );
  }

  return (
    <div
      dir="ltr"
      role="group"
      aria-label={
        lang === "ar"
          ? "تعديل الكمية في السلة"
          : "Change cart quantity"
      }
      className="grid min-h-11 w-full grid-cols-[44px_minmax(0,1fr)_44px] border border-[#0a583b] bg-white"
    >
      <button
        type="button"
        onClick={
          handleRemoveOne
        }
        aria-label={
          lang === "ar"
            ? "تقليل الكمية"
            : "Decrease quantity"
        }
        className="flex min-h-11 items-center justify-center border-r border-[#d7e5dc] bg-white text-[#0a583b] transition hover:bg-[#edf5f0]"
      >
        <Minus
          aria-hidden="true"
          className="h-4 w-4"
          strokeWidth={1.8}
        />
      </button>

      <output
        aria-live="polite"
        className="flex min-h-11 items-center justify-center bg-white text-sm font-extrabold text-[#142019]"
      >
        {quantity}
      </output>

      <button
        type="button"
        onClick={
          handleAddOne
        }
        aria-label={
          lang === "ar"
            ? "زيادة الكمية"
            : "Increase quantity"
        }
        className="flex min-h-11 items-center justify-center border-l border-[#d7e5dc] bg-white text-[#0a583b] transition hover:bg-[#edf5f0]"
      >
        <Plus
          aria-hidden="true"
          className="h-4 w-4"
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}