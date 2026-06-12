"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  sale_percent?: number;
  image_url: string | null;
};

export default function ProductDetailsAddToCart({
  product,
  finalPrice,
  originalPrice,
  salePercent,
}: {
  product: Product;
  finalPrice: number;
  originalPrice: number;
  salePercent: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  function handleAdd() {
    addToCart(product, quantity);
    window.dispatchEvent(new Event("cartUpdated"));
    setShowModal(true);
  }

  return (
    <>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          {salePercent > 0 && (
            <div className="mb-2 flex items-center gap-3">
              <span className="rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white">
                -{salePercent}%
              </span>

              <span className="text-lg font-bold text-gray-400 line-through">
                {originalPrice.toLocaleString()} SYP
              </span>
            </div>
          )}

          <p className="text-3xl font-extrabold text-green-700">
            {Math.round(finalPrice).toLocaleString()} SYP
          </p>
        </div>

        <div className="flex h-9 items-center rounded-full border border-gray-300 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center text-base font-extrabold text-gray-700"
          >
            -
          </button>

          <span className="min-w-7 text-center text-sm font-extrabold text-gray-900">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-9 w-9 items-center justify-center text-base font-extrabold text-gray-700"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-8 hidden md:block">
        <button
          onClick={handleAdd}
          className="w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Add to Cart
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 pb-24 shadow-lg md:hidden">
        <button
          onClick={handleAdd}
          className="w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Add to Cart
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
            <div className="mb-4 text-5xl text-green-600">✓</div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              Added to Cart
            </h2>

            <p className="mt-3 text-gray-600">
              {quantity} × {product.name} has been added successfully.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/cart"
                className="rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Go to Cart
              </a>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-gray-300 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}