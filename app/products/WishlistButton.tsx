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
      className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition hover:scale-105"
    >
      {saved ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
    </button>
  );
}