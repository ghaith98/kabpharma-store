import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return <p className="p-8 text-red-600">Error: {error.message}</p>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <Image
        src="/logo.png"
        alt=""
        width={1600}
        height={1600}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] select-none"
      />

      <section className="relative z-10 mx-auto mb-10 max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          Our Products
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          Explore KAB Pharma skincare and personal care products.
        </p>
      </section>

      {!products || products.length === 0 ? (
        <div className="relative z-10 mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold">No products available</h2>
          <p className="mt-3 text-gray-500">Products will be added soon.</p>
        </div>
      ) : (
        <ProductsClient products={products} />
      )}
    </main>
  );
} 