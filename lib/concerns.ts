export type ConcernSource = {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
};

export type ConcernProductLinkSource = {
  concern_id?: number | string | null;
  product_id?: number | string | null;
};

export type ConcernWithProducts = ConcernSource & {
  productIds: number[];
};

/**
 * "Concerns" (e.g. Acne, Dryness, Radiance) are a curated, admin-managed
 * grouping shown on the homepage, distinct from the product `categories`
 * used for catalog navigation. Each concern links to a handful of hand
 * picked products via the `product_concerns` join table.
 */
export function attachConcernProducts(
  concerns: readonly ConcernSource[],
  links: readonly ConcernProductLinkSource[]
): ConcernWithProducts[] {
  const productIdsByConcern = new Map<number, number[]>();

  links.forEach((link) => {
    const concernId = Number(link.concern_id);
    const productId = Number(link.product_id);

    if (
      !Number.isFinite(concernId) ||
      !Number.isFinite(productId)
    ) {
      return;
    }

    const existing = productIdsByConcern.get(concernId) || [];
    existing.push(productId);
    productIdsByConcern.set(concernId, existing);
  });

  return concerns
    .map((concern) => ({
      ...concern,
      productIds:
        productIdsByConcern.get(Number(concern.id)) || [],
    }))
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.id - b.id
    );
}
