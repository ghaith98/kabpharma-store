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

export default function AddToCartButton({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    window.dispatchEvent(new Event("cartUpdated"));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1400);
  }

  return (
    <button
      onClick={handleAdd}
      className={`mt-5 w-full rounded-2xl py-3 font-semibold transition duration-300 ${
        added
          ? "bg-green-50 text-green-700 ring-1 ring-green-600"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {added ? "✓ Added" : "Add to Cart"}
    </button>
  );
}