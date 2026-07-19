import HomeClient from "./HomeClient";

import { supabase } from "@/lib/supabase";

export const revalidate = 60;
const HOME_PRODUCT_SELECT = `
  *,
  categories (
    id,
    name,
    name_ar,
    name_en
  ),
  product_variants (
    *
  )
`;

export default async function Home() {
  const [
    newProductsResult,
    featuredProductsResult,
    orderItemsResult,
    availableProductsResult,
    bannersResult,
  ] = await Promise.all([
    supabase
  .from("products")
  .select(
    HOME_PRODUCT_SELECT
  )
  .eq(
    "is_new_arrival",
    true
  )
  .order("id", {
    ascending: false,
  })
  .limit(6),

    supabase
  .from("products")
  .select(
    HOME_PRODUCT_SELECT
  )
  .eq(
    "featured",
    true
  )
  .order("id", {
    ascending: false,
  })
  .limit(8),

    supabase
      .from("order_items")
      .select(
        "product_id, quantity"
      ),

    supabase
      .from("products")
      .select("id")
      .eq(
        "is_out_of_stock",
        false
      ),

    supabase
      .from("home_banners")
      .select("*")
      .eq(
        "placement",
        "main"
      )
      .eq(
        "is_active",
        true
      )
      .order("sort_order", {
        ascending: true,
      }),
  ]);

  if (
    newProductsResult.error
  ) {
    console.error(
      "Failed to load new products:",
      newProductsResult.error
    );
  }

  if (
    featuredProductsResult.error
  ) {
    console.error(
      "Failed to load featured products:",
      featuredProductsResult.error
    );
  }

  if (
    orderItemsResult.error
  ) {
    console.error(
      "Failed to load order items:",
      orderItemsResult.error
    );
  }

  if (
    availableProductsResult.error
  ) {
    console.error(
      "Failed to load available products:",
      availableProductsResult.error
    );
  }

  if (
    bannersResult.error
  ) {
    console.error(
      "Failed to load main banners:",
      bannersResult.error
    );
  }

  const newProducts =
    newProductsResult.data ||
    [];

  const featuredProducts =
    featuredProductsResult.data ||
    [];

  const orderItems =
    orderItemsResult.data ||
    [];

  const availableProductsForRanking =
    availableProductsResult.data ||
    [];

  const banners =
    bannersResult.data ||
    [];

  const availableProductIds =
    new Set(
      availableProductsForRanking.map(
        (product) =>
          Number(product.id)
      )
    );

  const salesByProduct =
    orderItems.reduce(
      (
        accumulator: Record<
          string,
          number
        >,
        item
      ) => {
        if (!item.product_id) {
          return accumulator;
        }

        const productId =
          String(
            item.product_id
          );

        accumulator[productId] =
          (accumulator[
            productId
          ] || 0) +
          Number(
            item.quantity || 0
          );

        return accumulator;
      },
      {}
    );

  const topSellerIds =
    Object.entries(
      salesByProduct
    )
      .filter(
        ([productId]) =>
          availableProductIds.has(
            Number(productId)
          )
      )
      .sort(
        (
          firstProduct,
          secondProduct
        ) =>
          secondProduct[1] -
          firstProduct[1]
      )
      .slice(0, 5)
      .map(
        ([productId]) =>
          Number(productId)
      );

  let topSellerProducts:
    typeof newProducts = [];

  if (
    topSellerIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
  HOME_PRODUCT_SELECT
)
      .in(
        "id",
        topSellerIds
      );

    if (error) {
      console.error(
        "Failed to load bestseller products:",
        error
      );
    }

    topSellerProducts =
      topSellerIds
        .map((id) =>
          data?.find(
            (product) =>
              Number(
                product.id
              ) === id
          )
        )
        .filter(Boolean);
  }

  return (
    <HomeClient
      newProducts={
        newProducts
      }
      featuredProducts={
        featuredProducts
      }
      topSellerProducts={
        topSellerProducts
      }
      topSellerIds={
        topSellerIds
      }
      banners={
        banners
      }
    />
  );
}
