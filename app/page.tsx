import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false })
    .limit(3);

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-16 text-center">
        <Image
          src="/logo.png"
          alt="KAB Pharma"
          width={420}
          height={140}
          className="mb-8 h-auto w-auto max-w-full"
          priority
        />

        <p className="max-w-2xl text-2xl font-medium text-gray-700">
          Trusted Skincare & Personal Care Solutions
        </p>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-500">
          High-quality skincare and personal care products designed to support
          healthier, more confident everyday living.
        </p>

        <div className="mt-12">
          <a
            href="/products"
            className="rounded-2xl bg-green-600 px-10 py-5 text-lg font-semibold text-white transition hover:bg-green-700"
          >
            Shop Now
          </a>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Featured Products
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {products?.map((product) => (
              <div
  key={product.id}
  className="rounded-2xl bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
>
                <div className="mb-4 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <h3 className="text-xl font-bold">{product.name}</h3>

                <p className="mt-2 line-clamp-2 text-gray-600">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Why KAB Pharma?
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                High Quality
              </h3>

              <p className="text-gray-600">
                Carefully selected ingredients and reliable formulations.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                Trusted Products
              </h3>

              <p className="text-gray-600">
                Skincare and personal care products you can rely on.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                Fast Delivery
              </h3>

              <p className="text-gray-600">
                Simple ordering process with easy order tracking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}