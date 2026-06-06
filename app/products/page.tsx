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
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">Products</h1>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {products?.map((product) => (
          <div key={product.id} className="rounded-2xl bg-white p-5 shadow">
            <div className="mb-4 h-48 overflow-hidden rounded-xl bg-gray-200">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <h2 className="text-xl font-bold">{product.name}</h2>

            <p className="mt-2 text-gray-600">{product.description}</p>

            <p className="mt-4 font-bold">
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
        ))}
      </div>
    </main>
  );
}   