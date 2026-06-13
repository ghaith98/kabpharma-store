  export type WishlistItem = {
    id: number;
    name: string;
    price: number;
    original_price?: number;
    sale_percent?: number;
    image_url: string | null;
  };

 function getWishlistKey() {
  if (typeof window === "undefined") return null;

  const savedUser = localStorage.getItem("kab_user");

  if (!savedUser) return null;

  let user;

  try {
    user = JSON.parse(savedUser);
  } catch {
    return null;
  }

  if (!user.phone) return null;

  return `wishlist_${user.phone}`;
}

  export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  const key = getWishlistKey();
  if (!key) return [];

  const wishlist = localStorage.getItem(key);

  return wishlist ? JSON.parse(wishlist) : [];
}

export function saveWishlist(items: WishlistItem[]) {
  const key = getWishlistKey();
  if (!key) return;

  localStorage.setItem(key, JSON.stringify(items));
}

export function isInWishlist(id: number) {
  return getWishlist().some((item) => item.id === id);
}

export function toggleWishlist(item: WishlistItem) {
  const key = getWishlistKey();

  if (!key) {
    window.location.href = "/login";
    return;
  }

  const wishlist = getWishlist();

  const exists = wishlist.find((i) => i.id === item.id);

  const updated = exists
    ? wishlist.filter((i) => i.id !== item.id)
    : [...wishlist, item];

  saveWishlist(updated);

  window.dispatchEvent(new Event("wishlistUpdated"));
}