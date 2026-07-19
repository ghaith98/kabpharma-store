"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";

import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from "lucide-react";

import { addToCart } from "@/lib/cart";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import { useLanguage } from "../../../context/LanguageContext";

import type {
  ProductDetailVariant,
} from "./ProductDetailsClient";

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
  disabled = false,
}: {
  product: Product;
  finalPrice: number;
  originalPrice: number;
  salePercent: number;

  selectedVariant?:
    | ProductDetailVariant
    | null;

  disabled?: boolean;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [showModal, setShowModal] =
    useState(false);

  const cartDialogRef =
    useRef<HTMLDivElement>(null);

  useDialogFocus(showModal, cartDialogRef);

  useEffect(() => {
    if (!showModal) return;

    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowModal(false);
      }
    }

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [showModal]);

  const [quantity, setQuantity] =
    useState(1);

  function handleAdd() {
    if (disabled) {
      return;
    }

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

      variant_label_ar:
        variantLabelAr,

      variant_label_en:
        variantLabelEn,
    };

    addToCart(
      itemToAdd,
      quantity
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setShowModal(true);
  }

  const addButtonText = disabled
    ? isArabic
      ? "غير متوفر"
      : "Out of stock"
    : isArabic
    ? "أضف إلى السلة"
    : "Add to cart";

  return (
    <>
      <div className="mt-6 border-t border-[#dedfdd] pt-5">
        {/* Price */}
        <div className="min-w-0">
          <div
            aria-hidden={
              salePercent <= 0
            }
            className={`mb-1 flex h-5 items-center gap-2 ${
              salePercent > 0
                ? "visible"
                : "invisible"
            }`}
          >
            <span className="text-xs font-medium text-[#8c948e] line-through sm:text-sm">
              {originalPrice.toLocaleString()}{" "}
              SYP
            </span>

            <span className="text-[10px] font-bold text-red-600">
              -{salePercent}%
            </span>
          </div>

          <p
            className={`whitespace-nowrap text-2xl font-bold tracking-[-0.02em] sm:text-[28px] ${
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

       {/* Desktop quantity + Add to cart */}
<div className="mt-4 hidden items-stretch gap-3 md:flex">
  <div className="flex h-[48px] w-[128px] shrink-0 items-center border border-[#d8ddd9] bg-white">
    <button
      type="button"
      onClick={() =>
        setQuantity((current) =>
          Math.max(
            1,
            current - 1
          )
        )
      }
      disabled={disabled}
      aria-label={
        isArabic
          ? "تقليل الكمية"
          : "Decrease quantity"
      }
      className="flex h-full w-10 items-center justify-center text-[#c3c9c5] transition hover:bg-[#edf5f0] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Minus size={14} />
    </button>

    <span className="flex h-full min-w-11 flex-1 items-center justify-center text-center text-sm font-semibold text-[#142019]">
      {quantity}
    </span>

    <button
      type="button"
      onClick={() =>
        setQuantity(
          (current) =>
            current + 1
        )
      }
      disabled={disabled}
      aria-label={
        isArabic
          ? "زيادة الكمية"
          : "Increase quantity"
      }
      className="flex h-full w-10 items-center justify-center text-[#142019] transition hover:bg-[#edf5f0] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Plus size={14} />
    </button>
  </div>

  <button
    type="button"
    onClick={handleAdd}
    disabled={disabled}
    className="flex h-[48px] min-w-0 flex-1 items-center justify-center gap-2 rounded-none border border-[#0a583b] bg-[#0a583b] px-3 text-sm font-semibold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:border-[#dfe3df] disabled:bg-[#f4f5f4] disabled:text-[#9aa19c]"
  >
    <ShoppingBag size={17} />

    {addButtonText}
  </button>
</div>
</div>

      {/* Mobile sticky quantity + Add to cart */}
      <div className="fixed inset-x-0 bottom-[70px] z-40 grid grid-cols-[126px_minmax(0,1fr)] gap-1 border-t border-[#dedfdd] bg-white p-1 shadow-[0_-4px_16px_rgba(20,32,25,0.08)] md:hidden">
        <div className="flex h-[52px] items-center border border-[#d8ddd9] bg-white">
          <button
            type="button"
            onClick={() =>
              setQuantity((current) =>
                Math.max(
                  1,
                  current - 1
                )
              )
            }
            disabled={disabled}
            aria-label={
              isArabic
                ? "تقليل الكمية"
                : "Decrease quantity"
            }
            className="flex h-full w-10 items-center justify-center text-[#8c948e] transition hover:bg-[#edf5f0] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={14} />
          </button>

          <span className="flex h-full min-w-11 flex-1 items-center justify-center text-center text-sm font-semibold text-[#142019]">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              setQuantity(
                (current) =>
                  current + 1
              )
            }
            disabled={disabled}
            aria-label={
              isArabic
                ? "زيادة الكمية"
                : "Increase quantity"
            }
            className="flex h-full w-10 items-center justify-center text-[#142019] transition hover:bg-[#edf5f0] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="flex min-h-[52px] min-w-0 items-center justify-center gap-2 rounded-none border border-[#0a583b] bg-[#0a583b] px-3 text-sm font-semibold text-white transition active:bg-[#073f2c] disabled:cursor-not-allowed disabled:border-[#dfe3df] disabled:bg-[#f4f5f4] disabled:text-[#9aa19c]"
        >
          <ShoppingBag size={17} />

          {addButtonText}
        </button>
      </div>

      {/* Added to cart modal */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#07130d]/50 px-5 backdrop-blur-sm">
          <div
            ref={cartDialogRef}
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-modal-title"
            tabIndex={-1}
            className="relative w-full max-w-md border border-[#dfe4e0] bg-white p-7 text-center shadow-2xl sm:p-8"
          >
            <button
              type="button"
              onClick={() =>
                setShowModal(false)
              }
              aria-label={
                isArabic
                  ? "إغلاق"
                  : "Close"
              }
              className={`absolute top-4 flex h-9 w-9 items-center justify-center border border-[#dfe4e0] bg-white text-[#526057] transition hover:border-[#0a583b] hover:text-[#0a583b] ${
                isArabic
                  ? "left-4"
                  : "right-4"
              }`}
            >
              <X size={17} />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#edf5f0] text-[#0a583b]">
              <Check
                size={24}
                strokeWidth={2.4}
              />
            </div>

            <h2
              id="cart-modal-title"
              className="mt-5 text-2xl font-semibold text-[#142019]"
            >
              {isArabic
                ? "تمت الإضافة إلى السلة"
                : "Added to cart"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#536158]">
              {isArabic
                ? `تمت إضافة ${quantity} × ${product.name} بنجاح.`
                : `${quantity} × ${product.name} has been added successfully.`}
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Link
                href="/cart"
                className="flex min-h-12 items-center justify-center rounded-none border border-[#0a583b] bg-[#0a583b] px-5 font-semibold text-white transition hover:bg-[#073f2c]"
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
                className="min-h-12 rounded-none border border-[#bfc7c1] bg-white px-5 font-semibold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
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
