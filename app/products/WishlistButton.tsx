"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";

import {
  isInWishlist,
  toggleWishlist,
} from "@/lib/wishlist";

import type {
  WishlistItem,
} from "@/lib/wishlist";

import { useLanguage } from "../../context/LanguageContext";

export default function WishlistButton({
  product,
}: {
  product: WishlistItem;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    function updateSavedState() {
      setSaved(
        isInWishlist(product.id)
      );
    }

    updateSavedState();

    window.addEventListener(
      "wishlistUpdated",
      updateSavedState
    );

    window.addEventListener(
      "storage",
      updateSavedState
    );

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        updateSavedState
      );

      window.removeEventListener(
        "storage",
        updateSavedState
      );
    };
  }, [product.id]);

  function handleClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    toggleWishlist(product);

    setSaved(
      isInWishlist(product.id)
    );

    window.dispatchEvent(
      new Event(
        "wishlistUpdated"
      )
    );
  }

  const label = saved
    ? isArabic
      ? "إزالة من المفضلة"
      : "Remove from wishlist"
    : isArabic
    ? "إضافة إلى المفضلة"
    : "Add to wishlist";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      aria-pressed={saved}
      className={`group/wishlist relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white/95 backdrop-blur transition duration-200 hover:scale-105 active:scale-95 ${
        saved
          ? "border-red-100 text-red-600 shadow-sm"
          : "border-[#dfe4e0] text-[#526057] shadow-[0_2px_8px_rgba(7,63,44,0.05)] hover:border-[#b8cbbf] hover:bg-[#edf5f0] hover:text-[#0a583b]"
      }`}
    >
      {saved ? (
        <FaHeart
          size={16}
          className="transition-transform duration-200 group-hover/wishlist:scale-110"
        />
      ) : (
        <FaRegHeart
          size={17}
          className="transition-transform duration-200 group-hover/wishlist:scale-110"
        />
      )}
    </button>
  );
}