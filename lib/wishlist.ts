export type WishlistItem = {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  sale_percent?: number;
  image_url: string | null;
};

function getWishlistKey() {
  if (typeof window === "undefined") return "wishlist_guest";

  const savedUser = localStorage.getItem("kab_user");

  if (!savedUser) return "wishlist_guest";

  const user = JSON.parse(savedUser);

  return `wishlist_${user.phone}`;
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  const wishlist = localStorage.getItem(getWishlistKey());

  return wishlist ? JSON.parse(wishlist) : [];
}

export function saveWishlist(items: WishlistItem[]) {
  localStorage.setItem(
    getWishlistKey(),
    JSON.stringify(items)
  );
}

export function isInWishlist(id: number) {
  return getWishlist().some(
    (item) => item.id === id
  );
}

export function toggleWishlist(
  item: WishlistItem
) {
  const wishlist = getWishlist();

  const exists = wishlist.find(
    (i) => i.id === item.id
  );

  let updated;

  if (exists) {
    updated = wishlist.filter(
      (i) => i.id !== item.id
    );
  } else {
    updated = [...wishlist, item];
  }

  saveWishlist(updated);

  window.dispatchEvent(
    new Event("wishlistUpdated")
  );
}