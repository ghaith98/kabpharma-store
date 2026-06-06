import Image from "next/image";
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center">
        <Image
  src="/logo.png"
  alt="KAB Pharma"
  width={550}
  height={180}
  className="mb-8 h-auto w-auto max-w-full"
/>

        <p className="max-w-2xl text-2xl font-medium text-gray-700">
          Trusted Medical & Skincare Solutions
        </p>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-500">
          High-quality pharmaceutical and skincare products designed to support
          healthier everyday life with trusted formulations and reliable care.
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
            Why KAB Pharma?
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                High Quality
              </h3>

              <p className="text-gray-600">
                Carefully selected ingredients and reliable formulations.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="mb-3 text-xl font-bold text-green-700">
                Trusted Products
              </h3>

              <p className="text-gray-600">
                Pharmaceutical and skincare products you can rely on.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
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