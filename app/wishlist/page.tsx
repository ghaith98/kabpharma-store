"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWishlist, WishlistItem } from "@/lib/wishlist";
import { FaHeart } from "react-icons/fa";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setWishlist(getWishlist());

    function refresh() {
      setWishlist(getWishlist());
    }

    window.addEventListener("wishlistUpdated", refresh);

    return () => {
      window.removeEventListener("wishlistUpdated", refresh);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl text-red-500">
            <FaHeart className="mx-auto" />
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900">
            My Wishlist
          </h1>

          <p className="mt-3 text-gray-600">
            Your favorite products saved for later.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">
              Wishlist is empty
            </h2>

            <p className="mt-3 text-gray-600">
              Save products by clicking the heart icon.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {wishlist.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-48 items-center justify-center overflow-hidden bg-white p-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-gray-400">
                      No image
                    </span>
                  )}
                </div>

                <div className="p-4 text-center">
                  <h2 className="line-clamp-2 min-h-[48px] text-sm font-bold text-gray-900">
                    {product.name}
                  </h2>

                  <div className="mt-3">
                    {product.sale_percent &&
                    product.sale_percent > 0 ? (
                      <>
                        <p className="text-xs font-bold text-gray-400 line-through">
                          {product.original_price?.toLocaleString()} SYP
                        </p>

                        <p className="font-extrabold text-red-600">
                          {product.price.toLocaleString()} SYP
                        </p>
                      </>
                    ) : (
                      <p className="font-extrabold text-green-700">
                        {product.price.toLocaleString()} SYP
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}