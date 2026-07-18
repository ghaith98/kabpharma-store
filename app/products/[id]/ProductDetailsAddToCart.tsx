"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

import { addToCart } from "@/lib/cart";
import { useLanguage } from "../../../context/LanguageContext";
import type { ProductDetailVariant } from "./ProductDetailsClient";

type Product = {
  id: number;
  name: string;
  product_name?: string;
  price: number;
  original_price?: number;
  sale_percent?: number;
  image_url: string | null;

  variant_id?: number | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
};

export default function ProductDetailsAddToCart({
  product,
  finalPrice,
  originalPrice,
  salePercent,
  selectedVariant,
}: {
  product: Product;
  finalPrice: number;
  originalPrice: number;
  salePercent: number;
  selectedVariant?: ProductDetailVariant | null;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [showModal, setShowModal] =
    useState(false);

  const [quantity, setQuantity] =
    useState(1);

 function handleAdd() {
  const variantLabelAr =
    selectedVariant?.label_ar ||
    selectedVariant?.name_ar ||
    selectedVariant?.label ||
    selectedVariant?.name ||
    product.variant_label_ar ||
    null;

  const variantLabelEn =
    selectedVariant?.label_en ||
    selectedVariant?.name_en ||
    selectedVariant?.label ||
    selectedVariant?.name ||
    product.variant_label_en ||
    null;

  const itemToAdd: Omit<
    import("@/lib/cart").CartItem,
    "quantity"
  > = {
    ...product,

    variant_id:
      selectedVariant?.id != null
        ? Number(selectedVariant.id)
        : product.variant_id ?? null,

    variant_label_ar: variantLabelAr,
    variant_label_en: variantLabelEn,
  };

  addToCart(itemToAdd, quantity);

  window.dispatchEvent(
    new Event("cartUpdated")
  );

  setShowModal(true);
}

  return (
    <>
      <div className="mt-7 border-t border-gray-200 pt-6">
        <div className="flex items-end justify-between gap-5">
          <div>
            {salePercent > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-extrabold text-red-600">
                  -{salePercent}%
                </span>

                <span className="text-sm font-bold text-gray-400 line-through">
                  {originalPrice.toLocaleString()} SYP
                </span>
              </div>
            )}

            <p
              className={`text-3xl font-extrabold tracking-tight ${
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
          </div>

          <div className="flex h-12 items-center rounded-full border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() =>
                setQuantity((current) =>
                  Math.max(1, current - 1)
                )
              }
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-green-700"
            >
              <Minus size={16} />
            </button>

            <span className="min-w-9 text-center text-sm font-extrabold text-gray-950">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity(
                  (current) => current + 1
                )
              }
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-green-700"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-6 hidden min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg md:flex"
        >
          <ShoppingBag size={19} />
          {isArabic
            ? "أضف إلى السلة"
            : "Add to cart"}
        </button>
      </div>

      {/* Mobile sticky purchase button */}
      <div className="fixed inset-x-0 bottom-[70px] z-40 border-t border-gray-100 bg-white/95 p-3 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={handleAdd}
          className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white active:scale-[0.99]"
        >
          <ShoppingBag size={19} />

          {isArabic
            ? `أضف إلى السلة · ${Math.round(
                finalPrice
              ).toLocaleString()} ل.س`
            : `Add to cart · ${Math.round(
                finalPrice
              ).toLocaleString()} SYP`}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 px-5 backdrop-blur-sm">
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() =>
                setShowModal(false)
              }
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
            >
              <X size={17} />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
              <Check size={27} strokeWidth={2.5} />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-gray-950">
              {isArabic
                ? "تمت الإضافة إلى السلة"
                : "Added to cart"}
            </h2>

            <p className="mt-3 leading-7 text-gray-600">
              {isArabic
                ? `تمت إضافة ${quantity} × ${product.name} بنجاح.`
                : `${quantity} × ${product.name} has been added successfully.`}
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Link
                href="/cart"
                className="flex min-h-12 items-center justify-center rounded-full bg-[#0a583b] px-5 font-extrabold text-white transition hover:bg-[#073f2c]"
              >
                {isArabic
                  ? "الذهاب إلى السلة"
                  : "View cart"}
              </Link>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="min-h-12 rounded-full border border-gray-200 px-5 font-extrabold text-gray-700 transition hover:bg-gray-50"
              >
                {isArabic
                  ? "متابعة التسوق"
                  : "Continue shopping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
