"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCart, saveCart } from "@/lib/cart";

export default function PaymentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("Please upload payment proof");
      return;
    }

    const checkout = JSON.parse(localStorage.getItem("checkout") || "{}");
    const cart = getCart();

    if (!checkout.name || !checkout.phone || !checkout.address) {
      alert("Missing checkout information");
      window.location.href = "/checkout";
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty");
      window.location.href = "/products";
      return;
    }

    setLoading(true);

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const filePath = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file);

    if (uploadError) {
      alert(uploadError.message);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    const paymentProofUrl = publicUrlData.publicUrl;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: checkout.name,
        phone: checkout.phone,
        address: checkout.address,
        total_price: total,
        status: "pending_payment_review",
        payment_proof_url: paymentProofUrl,
      })
      .select()
      .single();

    if (orderError) {
      alert(orderError.message);
      setLoading(false);
      return;
    }

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      alert(itemsError.message);
      setLoading(false);
      return;
    }

    saveCart([]);
    localStorage.removeItem("checkout");

    window.location.href = `/orders/${order.id}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-6 text-3xl font-bold">Payment</h1>

        <div className="mb-6 rounded-2xl bg-gray-100 p-6 text-center">
          <p className="mb-4 font-bold">Scan QR Code to Pay</p>

          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-white">
            QR CODE
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full rounded-xl border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 text-white disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Confirm Payment"}
          </button>
        </form>
      </div>
    </main>
  );
}