"use client";

import { addToCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
};

export default function AddToCartButton({ product }: { product: Product }) {
  return (
    <button
      onClick={() => {
        addToCart(product);
        alert("Product added to cart");
      }}
      className="mt-4 w-full rounded-xl bg-black py-3 text-white"
    >
      Add to Cart
    </button>
  );
}