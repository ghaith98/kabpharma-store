"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export default function ProductsClient({ products }: { products: any[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const categories = Array.from(
    new Map(
      products
        .filter((product) => product.categories)
        .map((product) => [
          product.categories.id,
          {
            id: product.categories.id,
            name: product.categories.name,
          },
        ])
    ).values()
  );

  const filteredProducts = products.filter((product) => {
    const text = `${product.name} ${product.description}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      selectedCategoryId === null || product.category_id === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="relative z-10 mx-auto mb-6 max-w-xl">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-black placeholder:text-gray-500 outline-none shadow-sm transition focus:border-green-600"
        />
      </div>

      <div className="relative z-10 mx-auto mb-8 flex max-w-5xl flex-wrap justify-center gap-3">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`rounded-full px-5 py-2 font-bold transition ${
            selectedCategoryId === null
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          All
        </button>

        {categories.map((category: any) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
            className={`rounded-full px-5 py-2 font-bold transition ${
              selectedCategoryId === category.id
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="relative z-10 mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            No products found
          </h2>
          <p className="mt-3 text-gray-600">
            Try searching with another product name or category.
          </p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <Link href={`/products/${product.id}`}>
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
              </Link>

              <div className="flex flex-1 flex-col p-6">
                <Link href={`/products/${product.id}`}>
                  <h2 className="text-xl font-bold text-gray-900 hover:text-green-700">
                    {product.name}
                  </h2>
                </Link>

                {product.categories?.name && (
                  <p className="mt-2 text-sm font-bold text-green-700">
                    {product.categories.name}
                  </p>
                )}

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