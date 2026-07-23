export type CategoryShowcaseSource = {
  id: number;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

export type CategoryProductSource = {
  category_id?: number | string | null;
  image_url?: string | null;
  featured?: boolean | null;
};

export type CategoryWithImage = CategoryShowcaseSource & {
  image_url: string | null;
};

export type SpotlightProductSource = {
  image_url?: string | null;
  featured?: boolean | null;
};

/**
 * Picks a single representative product photo for an editorial spotlight
 * panel (e.g. the navbar mega menu). Featured products are preferred.
 */
export function pickSpotlightImage(
  products: readonly SpotlightProductSource[]
): string | null {
  const featured = products.find(
    (product) =>
      product.featured &&
      typeof product.image_url === "string" &&
      product.image_url.trim().length > 0
  );

  if (featured?.image_url) {
    return featured.image_url;
  }

  const fallback = products.find(
    (product) =>
      typeof product.image_url === "string" &&
      product.image_url.trim().length > 0
  );

  return fallback?.image_url || null;
}

/**
 * The `categories` table has no image column, so we represent each
 * category on the homepage / mega menu using a real product photo
 * from that category. Featured products are preferred so the
 * showcase favors curated imagery over whatever was added last.
 */
export function attachCategoryImages(
  categories: readonly CategoryShowcaseSource[],
  products: readonly CategoryProductSource[]
): CategoryWithImage[] {
  const imageByCategory = new Map<number, string>();

  const sortedProducts = [...products].sort((a, b) => {
    const featuredA = a.featured ? 1 : 0;
    const featuredB = b.featured ? 1 : 0;

    return featuredB - featuredA;
  });

  sortedProducts.forEach((product) => {
    const categoryId = Number(product.category_id);
    const imageUrl = product.image_url;

    if (
      !Number.isFinite(categoryId) ||
      imageByCategory.has(categoryId) ||
      typeof imageUrl !== "string" ||
      imageUrl.trim().length === 0
    ) {
      return;
    }

    imageByCategory.set(categoryId, imageUrl);
  });

  return categories.map((category) => ({
    ...category,
    image_url: imageByCategory.get(Number(category.id)) || null,
  }));
}
