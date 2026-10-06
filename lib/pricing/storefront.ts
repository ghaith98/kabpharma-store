import "server-only";

import { applyFlashSales } from "./flash";
import { loadActivePromotions } from "./quote";
import type { PromotionRule } from "./rules";

/*
  For the storefront pages (home, products, product, brand, best sellers,
  new arrivals, shop by need) and the assistant: write live flash sales
  into the products' sale price before they are shown.

  If the promotions cannot be read, the products are left unchanged: a page
  must never fail to load because of an offer.
*/

export async function loadStorefrontPromotions(): Promise<PromotionRule[]> {
  try {
    return await loadActivePromotions();
  } catch {
    return [];
  }
}

/**
 * Loads the promotions once and returns a function that writes the live
 * flash sales into any list of products:
 *
 *   const withFlashSales = await loadFlashSales();
 *   const products = withFlashSales(rows);
 */
export async function loadFlashSales() {
  const promotions = await loadStorefrontPromotions();
  const pricedAtMs = Date.now();

  return function withFlashSales<T>(products: T[] | null | undefined): T[] {
    return applyFlashSales(products || [], promotions, pricedAtMs);
  };
}
