"use client";

import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
};

export default function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        addToCart(product);
        router.push("/cart");
      }}
      className="mt-4 w-full rounded-xl bg-black py-3 text-white"
    >
      Add to Cart
    </button>
  );
}