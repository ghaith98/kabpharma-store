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

  try {
    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) return null;

    const phone = String(
      JSON.parse(savedUser)?.phone || ""
    ).trim();

    return phone ? `wishlist_${phone}` : null;
  } catch {
    return null;
  }
}

function normalizeWishlistItem(
  value: unknown
): WishlistItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const id = Number(item.id);
  const price = Number(item.price);
  const name = String(item.name || "").trim();

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !name
  ) {
    return null;
  }

  const normalized: WishlistItem = {
    id,
    name,
    price,
    image_url:
      typeof item.image_url === "string"
        ? item.image_url
        : null,
  };

  for (const key of [
    "original_price",
    "sale_percent",
  ] as const) {
    const fieldValue = Number(item[key]);

    if (Number.isFinite(fieldValue)) {
      normalized[key] = fieldValue;
    }
  }

  return normalized;
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];

  const key = getWishlistKey();

  if (!key) return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeWishlistItem)
      .filter(
        (item): item is WishlistItem => item !== null
      );
  } catch {
    return [];
  }
}

export function saveWishlist(items: WishlistItem[]) {
  const key = getWishlistKey();

  if (!key) return;

  try {
    localStorage.setItem(
      key,
      JSON.stringify(
        items
          .map(normalizeWishlistItem)
          .filter(Boolean)
      )
    );
  } catch {
    // Keep the storefront usable if browser storage is unavailable.
  }
}

export function isInWishlist(id: number) {
  return getWishlist().some((item) => item.id === id);
}

export function toggleWishlist(item: WishlistItem) {
  if (!getWishlistKey()) {
    return false;
  }

  const wishlist = getWishlist();
  const exists = wishlist.some(
    (current) => current.id === item.id
  );

  saveWishlist(
    exists
      ? wishlist.filter(
          (current) => current.id !== item.id
        )
      : [...wishlist, item]
  );

  window.dispatchEvent(new Event("wishlistUpdated"));
  return true;
}
