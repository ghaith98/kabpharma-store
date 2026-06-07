import Image from "next/image";
import { supabase } from "@/lib/supabase";
import AddToCartButton from "./AddToCartButton";

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
        <div className="relative z-10 mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex h-56 items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-xl font-bold text-gray-900">  
                  {product.name}
                </h2>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600">
                  {product.description}
                </p>

                <p className="mt-4 text-xl font-extrabold text-green-700">
                  {Number(product.price).toLocaleString()} SYP
                </p>

                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image_url: product.image_url,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}