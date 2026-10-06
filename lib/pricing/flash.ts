/*
  Flash sales on product listings.

  Every card and product page already reads `sale_percent` to show a sale
  price. A flash sale is "a sale % that is only true between two dates", so
  the server writes the flash sale into `sale_percent` before the products
  reach the page, and keeps the product's own sale in `regular_sale_percent`.
  No price component has to know flash sales exist.

  Pure: shared by server pages and by the browser.
*/

import {
  clampPercent,
  isPromotionLive,
  promotionCovers,
  type PromotionRule,
} from "./rules";

type ProductRow = {
  id?: unknown;
  category_id?: unknown;
  brand_id?: unknown;
  sale_percent?: unknown;
};

export type FlashSaleFields = {
  sale_percent?: number | null;
  /** The product's own sale %, when a flash sale replaced it. */
  regular_sale_percent?: number | null;
  /** Set only while a flash sale decides the price. */
  flash_sale_ends_at?: string | null;
  flash_sale_id?: string | null;
};

function toId(value: unknown) {
  const number = Number(value);
  return value != null && Number.isFinite(number) ? number : null;
}

/** The best flash sale covering this whole product right now, if any. */
export function findFlashSale(
  product: ProductRow,
  promotions: PromotionRule[],
  nowMs: number
) {
  const productId = toId(product.id);
  if (productId == null) return null;

  const target = {
    productId,
    variantId: null,
    categoryId: toId(product.category_id),
    brandId: toId(product.brand_id),
  };

  let best: PromotionRule | null = null;

  for (const rule of promotions) {
    if (rule.kind !== "flash_sale") continue;
    // Flash sales are for whole products (all sizes share one sale %).
    if (rule.scope === "product" && !rule.allSizes) continue;
    if (!isPromotionLive(rule, nowMs)) continue;
    if (!promotionCovers(rule, target)) continue;

    if (!best || rule.discountPercent > best.discountPercent) {
      best = rule;
    }
  }

  return best;
}

/**
 * Returns the products with live flash sales written into sale_percent.
 * Products on a flash sale also carry the FlashSaleFields above.
 */
export function applyFlashSales<T>(
  products: T[],
  promotions: PromotionRule[],
  nowMs: number
): T[] {
  const flashSales = promotions.filter(
    (rule) => rule.kind === "flash_sale"
  );

  if (flashSales.length === 0) return products;

  return products.map((product) => {
    // Rows come loosely typed from the database; only these fields matter.
    const row = (product || {}) as ProductRow;
    const flash = findFlashSale(row, flashSales, nowMs);
    const regular = clampPercent(row.sale_percent);

    // The bigger discount counts; they are never added together.
    if (!flash || flash.discountPercent <= regular) return product;

    const onFlashSale: ProductRow & FlashSaleFields = {
      ...row,
      sale_percent: flash.discountPercent,
      regular_sale_percent: regular,
      flash_sale_ends_at: flash.endsAt,
      flash_sale_id: flash.id,
    };

    return onFlashSale as T;
  });
}

/**
 * Browser side: puts back the product's own sale once a flash sale's end
 * time has passed, without waiting for the page to be rebuilt.
 */
export function expireFlashSales<T extends FlashSaleFields>(
  products: T[],
  nowMs: number
): T[] {
  let changed = false;

  const next = products.map((product) => {
    if (!product.flash_sale_ends_at) return product;

    const endsAt = new Date(product.flash_sale_ends_at).getTime();
    if (!Number.isFinite(endsAt) || endsAt > nowMs) return product;

    changed = true;

    const ended: FlashSaleFields = {
      ...product,
      sale_percent: Number(product.regular_sale_percent || 0),
      regular_sale_percent: null,
      flash_sale_ends_at: null,
      flash_sale_id: null,
    };

    return ended as T;
  });

  return changed ? next : products;
}

/** The next moment one of these products' flash sales ends, or null. */
export function nextFlashSaleEnd(
  products: Array<FlashSaleFields>,
  nowMs: number
) {
  let next: number | null = null;

  for (const product of products) {
    if (!product.flash_sale_ends_at) continue;

    const endsAt = new Date(product.flash_sale_ends_at).getTime();
    if (!Number.isFinite(endsAt) || endsAt <= nowMs) continue;

    if (next == null || endsAt < next) next = endsAt;
  }

  return next;
}
