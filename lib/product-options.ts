/*
  "Main size" option.

  A product can have a main size (size_ar / size_en, with the product's own
  price and image) and, optionally, extra options (product_variants).

  - Main size only       → shown as a plain size label, no choices.
  - Main size + options  → the main size is offered as a choice next to the
                           options. In the cart and orders it is the product
                           itself (no option id), priced at the product price.
  - Options only (older products, no main size) → unchanged: only the
                           options are offered, as before.
*/

export const MAIN_OPTION_ID = "main";

type SizedProduct = {
  // unknown: also accepts loosely typed database rows on the server.
  size_ar?: unknown;
  size_en?: unknown;
};

export function hasMainSize(product: SizedProduct | null | undefined) {
  return Boolean(
    String(product?.size_ar || "").trim() ||
      String(product?.size_en || "").trim()
  );
}

/** Option id as stored in the cart/orders: the main size has none. */
export function optionIdToNumber(id: unknown): number | null {
  if (id == null || id === MAIN_OPTION_ID) return null;
  const value = Number(id);
  return Number.isFinite(value) ? value : null;
}

/** The main size shaped like an option, for the size pickers. */
export function buildMainOption(product: {
  price?: number | string | null;
  image_url?: string | null;
  size_ar?: string | null;
  size_en?: string | null;
}) {
  return {
    id: MAIN_OPTION_ID,
    price: Number(product.price || 0),
    label_ar: product.size_ar || product.size_en || "",
    label_en: product.size_en || product.size_ar || "",
    images: product.image_url ? [product.image_url] : null,
  };
}
