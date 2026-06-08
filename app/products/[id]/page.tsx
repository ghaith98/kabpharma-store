import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
import RelatedProductsSwiper from "./RelatedProductsSwiper";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    return <main className="p-10 text-center">Product not found</main>;
  }

  const { data: relatedProducts } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(5);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <a
            href="/"
            className="inline-block rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Home
          </a>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
                No image
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-6 leading-8 text-gray-700">
              {product.description}
            </p>

            <p className="mt-6 text-3xl font-extrabold text-green-700">
              {Number(product.price).toLocaleString()} SYP
            </p>

            <div className="mt-8">
              <ProductDetailsAddToCart
  product={{
    id: product.id,
    name: product.name,
    price: Number(product.price),
    image_url: product.image_url,
  }}
/>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mx-auto mt-10 max-w-4xl">
          <h2 className="mb-6 text-2xl font-extrabold text-gray-900">
            You may also like
          </h2>

         <RelatedProductsSwiper products={relatedProducts} />
        </section>
      )}
    </main>
  );
} 