"use client";

import { useEffect, useState } from "react";
import { CartItem, getCart } from "@/lib/cart";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    localStorage.setItem(
      "checkout",
      JSON.stringify({
        name,
        phone,
        address,
      })
    );

    window.location.href = "/payment";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Checkout
          </h1>

          <p className="mt-3 text-gray-700">
            Add your delivery details to continue to payment.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-8 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              Delivery Information
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />

              <textarea
                placeholder="Delivery Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={5}
                className="w-full rounded-2xl border border-gray-300 p-4 text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700"
            >
              Continue To Payment
            </button>
          </form>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900">
              Order Summary
            </h2>

            <div className="mt-5 space-y-4 border-b border-gray-200 pb-4">
              {cart.length === 0 ? (
                <p className="text-gray-700">Your cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {item.name}
                      </p>

                      <p className="mt-1 text-gray-700">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-green-700">
                      {(item.price * item.quantity).toLocaleString()} SYP
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-between text-lg font-extrabold text-gray-900">
              <span>Total</span>

              <span className="text-green-700">
                {total.toLocaleString()} SYP
              </span>
            </div>

            <a
              href="/cart"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              Back to Cart
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}