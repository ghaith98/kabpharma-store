import { supabase } from "@/lib/supabase";
import AddToCartButton from "../AddToCartButton";

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
    return (
      <main className="p-10 text-center">
        Product not found
      </main>
    );
  }

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
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full rounded-3xl object-cover"
            />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">
              {product.name}
            </h1>

            <p className="mt-6 leading-8 text-gray-600">
              {product.description}
            </p>

            <p className="mt-6 text-3xl font-extrabold text-green-700">
              {Number(product.price).toLocaleString()} SYP
            </p>

            <div className="mt-8">
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

        </div>
      </div>
    </main>
  );
}