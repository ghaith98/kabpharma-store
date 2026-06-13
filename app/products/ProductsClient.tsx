"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaFilter, FaTimes } from "react-icons/fa";
import AddToCartButton from "./AddToCartButton";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import WishlistButton from "./WishlistButton";

export default function ProductsClient({
  products,
  showSearch = false,
  showCategories = true,
  bestSellerIds = [],
}: {
  products: any[];
  showSearch?: boolean;
  showCategories?: boolean;
  bestSellerIds?: number[];
}) {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const categories = Array.from(
    new Map(
      products
        .filter((product) => product.categories)
        .map((product) => [
          product.categories.id,
          { id: product.categories.id, name: product.categories.name },
        ])
    ).values()
  );

  function getFinalPrice(product: any) {
    const salePercent = Number(product.sale_percent || 0);
    const originalPrice = Number(product.price);

    return salePercent > 0
      ? originalPrice - originalPrice * (salePercent / 100)
      : originalPrice;
  }

  const maxProductPrice = Math.max(...products.map((p) => Number(p.price)));

  const [priceRange, setPriceRange] = useState([0, maxProductPrice]);

  function clearFilters() {
    setSelectedCategoryId(null);
    setSortBy("default");
    setPriceRange([0, maxProductPrice]);
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setOnSaleOnly(false);
  }

  const filteredProducts = products
    .filter((product) => {
      const text = `${product.name} ${product.description} ${
        product.categories?.name || ""
      }`.toLowerCase();

      const finalPrice = getFinalPrice(product);

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory =
        selectedCategoryId === null || product.category_id === selectedCategoryId;
      const matchesPrice =
        finalPrice >= priceRange[0] && finalPrice <= priceRange[1];
      const matchesStock = !inStockOnly || product.is_out_of_stock === false;
      const matchesSale = !onSaleOnly || Number(product.sale_percent || 0) > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesStock &&
        matchesSale
      );
    })
    .sort((a, b) => {
      if (sortBy === "price_low") return getFinalPrice(a) - getFinalPrice(b);
      if (sortBy === "price_high") return getFinalPrice(b) - getFinalPrice(a);
      if (sortBy === "newest") return Number(b.id) - Number(a.id);
      return 0;
    });

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

      <div className="relative z-10 mx-auto mb-6 flex max-w-6xl items-center justify-between gap-4">
        <p className="text-sm font-bold text-gray-600">
          {filteredProducts.length} products found
        </p>

        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-gray-800 shadow-sm ring-1 ring-gray-100 transition hover:bg-green-50 hover:text-green-700"
        >
          <FaFilter size={14} />
          Filter
        </button>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-[999] bg-black/40">
          <div className="h-full w-[85%] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaFilter size={16} />
                <h2 className="text-lg font-extrabold text-gray-900">Filter</h2>
              </div>

              <button
                onClick={() => setFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {showCategories && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="mb-4 text-xl font-bold text-gray-900">
                  Product categories
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`block w-full text-left text-sm font-bold ${
                      selectedCategoryId === null ? "text-green-700" : "text-gray-800"
                    }`}
                  >
                    All
                  </button>

                  {categories.map((category: any) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`block w-full text-left text-sm font-bold ${
                        selectedCategoryId === category.id
                          ? "text-green-700"
                          : "text-gray-800"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-gray-200 py-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Availability
              </h3>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={() => setInStockOnly(!inStockOnly)}
                    className="h-4 w-4"
                  />
                  In stock
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={() => setOnSaleOnly(!onSaleOnly)}
                    className="h-4 w-4"
                  />
                  On sale
                </label>
              </div>
            </div>

            <div className="border-b border-gray-200 py-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Price</h3>

              <div className="px-2">
                <Slider
                  range
                  min={0}
                  max={maxProductPrice}
                  value={priceRange}
                  onChange={(value) => setPriceRange(value as number[])}
                />

                <div className="mt-4 flex justify-between text-sm font-bold text-gray-700">
                  <span>{priceRange[0].toLocaleString()} SYP</span>
                  <span>{priceRange[1].toLocaleString()} SYP</span>
                </div>
              </div>
            </div>

            <div className="py-6">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Sort by</h3>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 p-3 text-black outline-none focus:border-green-600"
              >
                <option value="default">Default</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            <div className="sticky bottom-0 -mx-6 mt-4 flex gap-3 border-t bg-white p-6">
              <button
                onClick={clearFilters}
                className="flex-1 rounded-2xl border border-gray-300 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="relative z-10 mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">No products found</h2>
          <p className="mt-3 text-gray-600">
            Try changing the filters or searching another product.
          </p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const salePercent = Number(product.sale_percent || 0);
            const originalPrice = Number(product.price);
            const finalPrice = getFinalPrice(product);

            return (
              <div
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="relative flex h-40 items-center justify-center overflow-hidden bg-white p-3 sm:h-48">
                    <div className="absolute right-3 top-3 z-20">
                      <WishlistButton
                        product={{
                          id: product.id,
                          name: product.name,
                          price: Math.round(finalPrice),
                          original_price: originalPrice,
                          sale_percent: salePercent,
                          image_url: product.image_url,
                        }}
                      />
                    </div>

                    {product.is_out_of_stock ? (
                      <span className="absolute left-3 top-3 z-20 rounded-full bg-gray-900 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                        Out of Stock
                      </span>
                    ) : (
                      salePercent > 0 && (
                        <span className="absolute left-3 top-3 z-20 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600 shadow-sm">
  -{salePercent}%
</span>
                      )
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

                <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-center">
                  <Link href={`/products/${product.id}`}>
                    <h2 className="line-clamp-2 text-sm font-extrabold text-gray-900 transition hover:text-green-700 sm:text-base">
                      {product.name}
                    </h2>
                  </Link>

                  <div className="mt-2 flex items-center justify-center gap-2">
                    {salePercent > 0 && (
                      <span className="text-sm font-bold text-gray-400 line-through">
                        {originalPrice.toLocaleString()} SYP
                      </span>
                    )}

                    <span
                      className={`text-lg font-extrabold ${
                        salePercent > 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {Math.round(finalPrice).toLocaleString()} SYP
                    </span>
                  </div>

                  <div className="mt-4">
                    {product.is_out_of_stock ? (
                      <button
                        disabled
                        className="w-full rounded-2xl bg-gray-200 py-3 font-semibold text-gray-500"
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
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}