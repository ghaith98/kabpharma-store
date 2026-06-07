import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ProductSwiper from "./ProductSwiper";

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false })
    .limit(8);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50">
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <Image
            src="/logo.png"
            alt="KAB Pharma"
            width={420}
            height={140}
            className="mx-auto mb-8 h-auto w-auto max-w-full"
            priority
          />

          <p className="mx-auto max-w-2xl text-2xl font-extrabold text-gray-900">
            Trusted Skincare & Personal Care Solutions
          </p>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            High-quality skincare and personal care products designed to support
            healthier, more confident everyday living.
          </p>

          <div className="mt-8">
            <a
              href="/products"
              className="inline-block rounded-2xl bg-green-600 px-8 py-4 font-bold text-white transition hover:bg-green-700"
            >
              Shop Now
            </a>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-gray-900">
            منتجاتنا المميزة
          </h2>

          <ProductSwiper products={products || []} />
        </div>
      </section>

      <section className="pb-16 pt-8">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-gray-900">
            Why KAB Pharma?
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                High Quality
              </h3>

              <p className="text-gray-600">
                Carefully selected ingredients and reliable formulations.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                Trusted Products
              </h3>

              <p className="text-gray-600">
                Skincare and personal care products you can rely on.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm">
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