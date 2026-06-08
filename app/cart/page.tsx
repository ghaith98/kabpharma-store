"use client";

import { useEffect, useState } from "react";
import { CartItem, getCart, saveCart } from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
  }, []);

  function syncCart(updatedCart: CartItem[]) {
    setCart(updatedCart);
    saveCart(updatedCart);
    window.dispatchEvent(new Event("cartUpdated"));
  }

  function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return;

    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );

    syncCart(updatedCart);
  }

  function removeItem(id: number) {
    const updatedCart = cart.filter((item) => item.id !== id);
    syncCart(updatedCart);
  }

  function clearCart() {
    const confirmClear = confirm("Are you sure you want to clear the cart?");
    if (!confirmClear) return;

    syncCart([]);
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-32 lg:pb-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Your Cart
          </h1>

          <p className="mt-3 text-gray-700">
            Review your selected products before checkout.
          </p>
        </section>

        {cart.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
              🛒
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-600">
              Add products to your cart to continue.
            </p>

            <a
              href="/products"
              className="mt-6 inline-block rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Shop Now
            </a>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {item.name}
                      </h2>

                      <p className="mt-1 font-semibold text-green-700">
                        {item.price.toLocaleString()} SYP
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-600">
                        {item.quantity} × {item.price.toLocaleString()} SYP
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        Subtotal:{" "}
                        {(item.price * item.quantity).toLocaleString()} SYP
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-xl border border-gray-300 bg-white">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="px-4 py-2 text-lg font-bold text-gray-800"
                      >
                        -
                      </button>

                      <span className="min-w-10 text-center font-bold text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-4 py-2 text-lg font-bold text-gray-800"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl bg-red-50 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="hidden h-fit rounded-3xl bg-white p-6 shadow-sm lg:block">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-5 flex justify-between border-b border-gray-200 pb-4 text-gray-700">
                <span>Items</span>
                <span>{itemsCount}</span>
              </div>

              <div className="mt-4 flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-green-700">
                  {total.toLocaleString()} SYP
                </span>
              </div>

              <a
                href="/checkout"
                className="mt-6 block rounded-2xl bg-green-600 p-4 text-center font-bold text-white transition hover:bg-green-700"
              >
                تأكيد الطلب
              </a>

              <button
                onClick={clearCart}
                className="mt-3 w-full rounded-2xl border border-gray-300 p-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Clear Cart
              </button>
            </aside>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">
                Total
              </p>
              <p className="font-extrabold text-green-700">
                {total.toLocaleString()} SYP
              </p>
            </div>

            <a
              href="/checkout"
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white"
            >
              تأكيد الطلب
            </a>
          </div>
        </div>
      )}
    </main>
  );
}