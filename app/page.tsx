import HomeClient from "./HomeClient";
import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";


export default async function Home() {
  const { data: newProducts } = await supabase
  .from("products")
  .select("*")
  .eq("is_new_arrival", true)
  .order("id", { ascending: false })
  .limit(6);

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("id", { ascending: false })
    .limit(8);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity");
    const { data: availableProductsForRanking } = await supabase
  .from("products")
  .select("id")
  .eq("is_out_of_stock", false);

const availableProductIds = new Set(
  (availableProductsForRanking || []).map((product) => product.id)
);

 const topSellerIds = Object.entries(
  (orderItems || []).reduce((acc: Record<string, number>, item: any) => {
    if (!item.product_id) return acc;

    acc[item.product_id] =
      (acc[item.product_id] || 0) + Number(item.quantity || 0);

    return acc;
  }, {})
)
  .filter(([productId]) => availableProductIds.has(Number(productId)))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([productId]) => Number(productId));

  let topSellerProducts: any[] = [];

  if (topSellerIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", topSellerIds);

    topSellerProducts = topSellerIds
      .map((id) => data?.find((product) => product.id === id))
      .filter(Boolean);
  }

  const { data: banners } = await supabase
    .from("home_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

    return (
  <HomeClient
    newProducts={newProducts || []}
    featuredProducts={featuredProducts || []}
    topSellerProducts={topSellerProducts || []}
    topSellerIds={topSellerIds}
    banners={banners || []}
  />
);
  }