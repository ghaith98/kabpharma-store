import { supabase } from "@/lib/supabase";
import ProductsClient from "../products/ProductsClient";

export default async function SearchPage() {
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order("id", { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Search Products
          </h1>

          <p className="mt-3 text-gray-600">
            Find products quickly by name or category.
          </p>
        </div>

        <ProductsClient products={products || []} />
      </div>
    </main>
  );
}