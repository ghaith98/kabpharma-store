    "use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

export default function AdminDeliveryOrdersPage() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
const isMobileAdmin = searchParams.get("mobile") === "1";

  async function addOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("delivery_orders").insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      from_address: fromAddress,
      to_address: toAddress,
      price: Number(price),
      status: "pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCustomerName("");
    setCustomerPhone("");
    setFromAddress("");
    setToAddress("");
    setPrice("");

    alert("Delivery order added successfully");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex gap-2">
  {/* Desktop */}
  <a
  href={isMobileAdmin ? "/admin-mobile" : "/admin"}
  className="mb-6 inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
>
  ← Dashboard
</a>

  {/* Mobile */}
  <a
    href="/admin-mobile"
    className="inline-flex lg:hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Dashboard
  </a>
</div>

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Add Delivery Order
        </h1>

        <form onSubmit={addOrder} className="rounded-2xl bg-white p-6 shadow">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="text"
            placeholder="Customer Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="text"
            placeholder="From Address"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="text"
            placeholder="To Address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            required
            className="mb-3 w-full rounded-xl border p-3 text-black"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="mb-5 w-full rounded-xl border p-3 text-black"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Order"}
          </button>
        </form>
      </div>
    </main>
  );
}