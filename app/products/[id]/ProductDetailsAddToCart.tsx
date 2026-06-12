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
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  function handleAdd() {
    addToCart(product, quantity);
    window.dispatchEvent(new Event("cartUpdated"));
    setShowModal(true);
  }

  const quantityControl = (
    <div className="flex h-10 items-center rounded-full border border-gray-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
        className="flex h-10 w-10 items-center justify-center text-base font-extrabold text-gray-700"
      >
        -
      </button>

      <span className="min-w-8 text-center text-sm font-extrabold text-gray-900">
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => setQuantity(quantity + 1)}
        className="flex h-10 w-10 items-center justify-center text-base font-extrabold text-gray-700"
      >
        +
      </button>
    </div>
  );

  return (
    <>
      {compact ? (
        <div className="w-full">
          <div className="mb-2 flex justify-end">
            {quantityControl}
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded-2xl bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700"
          >
            Add to Cart
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl bg-gray-50 p-4 ring-1 ring-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-bold text-gray-900">Quantity</span>
            {quantityControl}
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Add to Cart
          </button>
        </div>
      )}

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