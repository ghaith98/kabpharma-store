import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">

        <h1 className="text-5xl font-bold text-center">
          KAB Pharma
        </h1>

        <p className="text-center text-gray-500 mt-4">
          Medical & Skincare Products
        </p>

        <div className="flex justify-center mt-10">
          <button className="bg-black text-white px-8 py-4 rounded-xl">
            Shop Now
          </button>
        </div>

      </div>
    </main>
  );
}