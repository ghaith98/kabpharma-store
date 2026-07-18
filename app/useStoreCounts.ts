"use client";

import { useSyncExternalStore } from "react";

import { getCart } from "@/lib/cart";
import { getWishlist } from "@/lib/wishlist";

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener("cartUpdated", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("cartUpdated", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToWishlist(onStoreChange: () => void) {
  window.addEventListener("wishlistUpdated", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("wishlistUpdated", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getCartCountSnapshot() {
  return getCart().reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
}

function getWishlistCountSnapshot() {
  return getWishlist().length;
}

function getEmptyCountSnapshot() {
  return 0;
}

export function useCartCount() {
  return useSyncExternalStore(
    subscribeToCart,
    getCartCountSnapshot,
    getEmptyCountSnapshot
  );
}

export function useWishlistCount() {
  return useSyncExternalStore(
    subscribeToWishlist,
    getWishlistCountSnapshot,
    getEmptyCountSnapshot
  );
}
