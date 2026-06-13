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
    <div className="mt-8 rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          {salePercent > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-extrabold text-red-600">
                -{salePercent}%
              </span>

              <span className="text-sm font-bold text-gray-400 line-through">
                {originalPrice.toLocaleString()} SYP
              </span>
            </div>
          )}

          <p className="text-2xl font-extrabold tracking-tight text-green-700">
            {Math.round(finalPrice).toLocaleString()} SYP
          </p>
        </div>

        <div className="flex h-10 items-center rounded-full bg-gray-50 p-1 ring-1 ring-gray-200">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-extrabold text-gray-600 transition hover:bg-white hover:text-green-700"
          >
            −
          </button>

          <span className="min-w-8 text-center text-sm font-extrabold text-gray-900">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-extrabold text-gray-600 transition hover:bg-white hover:text-green-700"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div className="mt-6 hidden md:block">
      <button
        onClick={handleAdd}
        className="w-full rounded-2xl bg-green-600 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md"
      >
        Add to Cart
      </button>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 p-4 pb-24 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <button
        onClick={handleAdd}
        className="w-full rounded-2xl bg-green-600 py-3.5 font-extrabold text-white shadow-sm transition active:scale-[0.98]"
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