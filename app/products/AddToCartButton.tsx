"use client";

import { addToCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
};

export default function AddToCartButton({
  product,
}: {
  product: Product;
}) {
  return (
    <button
      onClick={() => {
        addToCart(product);
        window.dispatchEvent(new Event("cartUpdated"));
      }}
      className="mt-5 w-full rounded-2xl bg-green-600 py-3 font-semibold text-white transition duration-300 hover:bg-green-700"
    >
      Add to Cart
    </button>
  );
}