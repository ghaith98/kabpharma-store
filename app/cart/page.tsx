"use client";

import { useEffect, useState } from "react";
import { CartItem, getCart, saveCart } from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );

    setCart(updatedCart);
    saveCart(updatedCart);
  }

  function removeItem(id: number) {
    const updatedCart = cart.filter((item) => item.id !== id);

    setCart(updatedCart);
    saveCart(updatedCart);
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">Cart</h1>

      <div className="mx-auto max-w-3xl space-y-4">
        {cart.length === 0 && (
          <p className="text-center text-gray-500">Your cart is empty</p>
        )}

        {cart.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-2xl bg-white p-5 shadow"
          >
            <div>
              <h2 className="font-bold">{item.name}</h2>
              <p>{item.price.toLocaleString()} SYP</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="rounded bg-gray-200 px-3 py-1"
              >
                -
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="rounded bg-gray-200 px-3 py-1"
              >
                +
              </button>

              <button
                onClick={() => removeItem(item.id)}
                className="rounded bg-red-600 px-3 py-1 text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-white p-5 text-xl font-bold shadow">
          Total: {total.toLocaleString()} SYP
        </div>
        {cart.length > 0 && (
  <a
    href="/checkout"
    className="block rounded-2xl bg-black p-4 text-center font-bold text-white"
  >
    تأكيد الطلب
  </a>
)}
      </div>
    </main>
  );
}