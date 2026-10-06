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

  // Typed on the whole list, not on one item: a query result is sometimes
  // "rows, or an empty list" (two list types), and the item type has to be
  // read from whichever list it is.
  return function withFlashSales<List extends readonly unknown[]>(
    products: List | null | undefined
  ): List[number][] {
    return applyFlashSales<List[number]>(
      [...(products || [])],
      promotions,
      pricedAtMs
    );
  };
}
