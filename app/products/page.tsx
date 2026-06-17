  import Image from "next/image";
  import { supabase } from "@/lib/supabase";
  import ProductsClient from "./ProductsClient";
  import { Suspense } from "react";

  export default async function ProductsPage() {
    const { data: products, error } = await supabase
    .from("products")
    .select(`
      *,
      categories (
  id,
  name,
  name_ar,
  name_en
)
    `)
    .order("id", { ascending: true });
    if (error) {
      return <p className="p-8 text-red-600">Error: {error.message}</p>;
    }
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


const bestSellerIds = Object.entries(
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
  

    return (
      
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
        <Image
          src="/logo.png"
          alt=""
          width={1600}
          height={1600}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] select-none"
        />

        {!products || products.length === 0 ? (
          <div className="relative z-10 mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No products available</h2>
            <p className="mt-3 text-gray-500">Products will be added soon.</p>
          </div>
        ) : (
          <Suspense fallback={<p className="text-center text-gray-600">Loading products...</p>}>
  <ProductsClient products={products} bestSellerIds={bestSellerIds} />
</Suspense>
        )}
      </main> 
    );
  } 