import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import ProductsClient from "../products/ProductsClient";
import { FaSearch } from "react-icons/fa";

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
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-4 py-8 pb-28 md:px-6 md:py-12 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-100 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
              <FaSearch size={18} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
                Search
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Find your products quickly.
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={<p className="text-center text-gray-600">Loading products...</p>}>
          <ProductsClient products={products || []} showCategories={false} />
        </Suspense>
      </div>
    </main>
  );
}