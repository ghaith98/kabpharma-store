import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductSwiper from "./ProductSwiper";
import HomeBannerSwiper from "./HomeBannerSwiper";

function ProductSection({
  eyebrow,
  title,
  products,
}: {
  eyebrow: string;
  title: string;
  products: any[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center sm:text-left">
          <span className="text-sm font-bold uppercase tracking-wider text-green-700">
            {eyebrow}
          </span>

          <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>

        <ProductSwiper products={products} />
      </div>
    </section>
  );
}

export default async function Home() {
  const { data: newProducts } = await supabase
  .from("products")
  .select("*")
  .eq("is_new_arrival", true)
  .order("id", { ascending: false })
  .limit(6);

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("id", { ascending: false })
    .limit(8);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity");

  const topSellerIds = Object.entries(
    (orderItems || []).reduce((acc: Record<string, number>, item: any) => {
      if (!item.product_id) return acc;

      acc[item.product_id] =
        (acc[item.product_id] || 0) + Number(item.quantity || 0);

      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([productId]) => Number(productId));

  let topSellerProducts: any[] = [];

  if (topSellerIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", topSellerIds);

    topSellerProducts = topSellerIds
      .map((id) => data?.find((product) => product.id === id))
      .filter(Boolean);
  }

  const { data: banners } = await supabase
    .from("home_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-b from-white via-gray-50 to-green-50">
      <section className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[-120px] top-10 h-72 w-72 rounded-full bg-green-100 blur-3xl" />
          <div className="absolute right-[-120px] top-40 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        </div>

        <div className="grid items-center gap-6 rounded-[1.5rem] bg-white/80 p-5 shadow-sm ring-1 ring-gray-100 backdrop-blur md:grid-cols-2 md:gap-10 md:rounded-[2rem] md:p-10">
          <div className="hidden md:block md:text-left">
            <span className="inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-100">
              KAB Pharma
            </span>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Trusted Skincare &
              <span className="block text-green-700">
                Personal Care Solutions
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 md:mx-0">
              High-quality skincare and personal care products designed to
              support healthier, more confident everyday living.
            </p>

            <div className="mt-8 flex justify-center md:justify-start">
              <Link
                href="/products"
                className="inline-block rounded-2xl bg-green-600 px-8 py-4 font-bold text-white shadow-sm transition hover:bg-green-700 md:ml-8"
              >
                Shop Now
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm font-bold text-gray-700 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                Quality Formulations
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                Easy Ordering
              </div>

              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                Order Tracking
              </div>
            </div>
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-green-100 blur-2xl" />

            <div className="relative rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <Image
                src="/logo.png"
                alt="KAB Pharma"
                width={420}
                height={140}
                className="h-auto w-full max-w-[360px]"
                priority
              />

              <div className="mt-6 rounded-3xl bg-gradient-to-b from-green-50 to-white p-5 text-center">
                <p className="text-sm font-bold text-green-700">
                  Skincare & Personal Care Products
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Carefully selected for everyday care.
                </p>
              </div>

              <Link
                href="/products"
                className="mt-6 block rounded-2xl bg-green-600 px-8 py-4 text-center font-bold text-white shadow-sm transition hover:bg-green-700 md:hidden"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="mx-auto max-w-6xl px-6">
          <HomeBannerSwiper banners={banners || []} />
        </div>
      </section>

      <ProductSection
        eyebrow="New"
        title="New Arrivals"
        products={newProducts || []}
      />

      <ProductSection
        eyebrow="Best Selling"
        title="Top Sellers"
        products={topSellerProducts || []}
      />

      <ProductSection
        eyebrow="Featured"
        title="Featured Products"
        products={featuredProducts || []}
      />

      <section className="pb-16 pt-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-green-700">
              Why choose us
            </span>

            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
              Why KAB Pharma?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                ✓
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                High Quality
              </h3>

              <p className="leading-7 text-gray-600">
                Carefully selected ingredients and reliable formulations for
                daily skincare and personal care.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                ✦
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                Trusted Products
              </h3>

              <p className="leading-7 text-gray-600">
                Practical products made for real everyday needs with a clear and
                simple shopping experience.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                →
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">
                Easy Ordering
              </h3>

              <p className="leading-7 text-gray-600">
                Simple checkout, payment proof upload, and order tracking after
                purchase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}