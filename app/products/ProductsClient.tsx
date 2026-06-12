"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";

export default function ProductsClient({
  products,
  showSearch = false,
  showCategories = true,
}: {
  products: any[];
  showSearch?: boolean;
  showCategories?: boolean;
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
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
    const text = `${product.name} ${product.description} ${
      product.categories?.name || ""
    }`.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    const matchesCategory =
      selectedCategoryId === null || product.category_id === selectedCategoryId;

    return matchesSearch && matchesCategory;
  });
  useEffect(() => {
  setSearch(searchParams.get("search") || "");
}, [searchParams]);

  return (
    <>
      
      {showSearch && (
  <div className="relative z-10 mx-auto mb-6 max-w-xl">
    <div className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600 focus:bg-white"
      />
    </div>
  </div>
)}

      {showCategories && (
  <div className="relative z-10 mx-auto mb-8 max-w-5xl overflow-x-auto rounded-3xl bg-white/90 p-3 shadow-sm ring-1 ring-gray-100 backdrop-blur">
    <div className="flex min-w-max gap-3">
      <button
        onClick={() => setSelectedCategoryId(null)}
        className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
          selectedCategoryId === null
            ? "bg-green-600 text-white shadow-sm"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        All
      </button>

      {categories.map((category: any) => (
        <button
          key={category.id}
          onClick={() => setSelectedCategoryId(category.id)}
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
            selectedCategoryId === category.id
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  </div>
)}

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
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const salePercent = Number(product.sale_percent || 0);
            const originalPrice = Number(product.price);
            const finalPrice =
              salePercent > 0
                ? originalPrice - originalPrice * (salePercent / 100)
                : originalPrice;

            return (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white p-4">
                    {product.is_out_of_stock && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        Out of Stock
                      </span>
                    )}

                    {salePercent > 0 && (
                      <span className="absolute right-3 top-3 z-10 rounded-full bg-pink-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        -{salePercent}%
                      </span>
                    )}

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-4 text-center">
                  <Link href={`/products/${product.id}`}>
                    <h2 className="line-clamp-2 min-h-[48px] text-base font-bold text-gray-900 transition hover:text-green-700">
                      {product.name}
                    </h2>
                  </Link>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    {salePercent > 0 && (
                      <span className="text-sm font-bold text-gray-400 line-through">
                        {originalPrice.toLocaleString()} SYP
                      </span>
                    )}

                    <span className="text-lg font-extrabold text-green-700">
                      {Math.round(finalPrice).toLocaleString()} SYP
                    </span>
                  </div>

                  {product.is_out_of_stock ? (
                    <button
                      disabled
                      className="mt-4 w-full rounded-none bg-gray-200 py-3 text-sm font-bold text-gray-500"
                    >
                      Out of Stock
                    </button>
                  ) : (
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: Math.round(finalPrice),
                        original_price: originalPrice,
                        sale_percent: salePercent,
                        image_url: product.image_url,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}