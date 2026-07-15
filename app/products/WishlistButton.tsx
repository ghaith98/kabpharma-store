"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import {
  isInWishlist,
  toggleWishlist,
  WishlistItem,
} from "@/lib/wishlist";

export default function WishlistButton({
  product,
}: {
  product: WishlistItem;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWishlist(product.id));
  }, [product.id]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist(product);
    setSaved(isInWishlist(product.id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Wishlist"
      className="absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#e1e6e2] bg-white/95 text-red-600 shadow-sm transition hover:border-red-200 hover:bg-white sm:right-3 sm:top-3 sm:h-10 sm:w-10"
    >
      {saved ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
    </button>
  );
}