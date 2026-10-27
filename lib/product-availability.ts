import { hasMainSize } from "./product-options";

type StockFlag = { is_out_of_stock?: unknown };
type StockProduct = StockFlag & {
  is_main_size_out_of_stock?: unknown; size_ar?: unknown; size_en?: unknown;
};

// Explicit availability flags only. Legacy quantity/stock fields do not
// represent inventory in this store and must never make an option unavailable.
export function isVariantOutOfStock(variant: StockFlag | null | undefined) {
  return variant?.is_out_of_stock === true;
}
export function isMainSizeOutOfStock(product: StockProduct) {
  return product.is_main_size_out_of_stock === true;
}
export function isProductOutOfStock(product: StockProduct, variants: StockFlag[] | null | undefined) {
  if (product.is_out_of_stock === true) return true;
  if (!variants?.length) return isMainSizeOutOfStock(product);
  if (hasMainSize(product) && !isMainSizeOutOfStock(product)) return false;
  return variants.every(isVariantOutOfStock);
}
