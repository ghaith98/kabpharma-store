"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">

        <h1 className="mb-6 text-3xl font-bold">
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border p-3"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-xl border p-3"
          />

          <textarea
            placeholder="Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full rounded-xl border p-3"
            rows={4}
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-black py-3 text-white"
          >
            Continue To Payment
          </button>

        </form>
      </div>
    </main>
  );
}