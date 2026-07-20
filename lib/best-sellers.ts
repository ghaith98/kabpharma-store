export type ProductSaleItem = {
  product_id?:
    | number
    | string
    | null;

  quantity?:
    | number
    | string
    | null;
};

export function rankBestSellerProductIds(
  orderItems: readonly ProductSaleItem[],
  availableProductIds?: ReadonlySet<number>
) {
  const salesByProduct =
    new Map<number, number>();

  orderItems.forEach((item) => {
    const productId =
      Number(item.product_id);

    const quantity =
      Number(item.quantity || 0);

    if (
      !Number.isFinite(productId) ||
      productId <= 0 ||
      !Number.isFinite(quantity)
    ) {
      return;
    }

    salesByProduct.set(
      productId,
      (salesByProduct.get(productId) || 0) +
        quantity
    );
  });

  return Array.from(
    salesByProduct.entries()
  )
    .filter(
      ([productId, quantity]) =>
        quantity > 0 &&
        (!availableProductIds ||
          availableProductIds.has(productId))
    )
    .sort(
      (
        [firstProductId, firstQuantity],
        [secondProductId, secondQuantity]
      ) =>
        secondQuantity - firstQuantity ||
        secondProductId - firstProductId
    )
    .map(([productId]) => productId);
}
