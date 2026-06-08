"use client";

import { useState } from "react";
import AddToCartButton from "./AddToCartButton";

export default function ProductsClient({ products }: { products: any[] }) {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((product) => {
    const text = `${product.name} ${product.description}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <>
      <div className="relative z-10 mx-auto mb-8 max-w-xl">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-black placeholder:text-gray-500 outline-none shadow-sm transition focus:border-green-600"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="relative z-10 mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            No products found
          </h2>
          <p className="mt-3 text-gray-600">
            Try searching with another product name.
          </p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
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
    </>
  );
}