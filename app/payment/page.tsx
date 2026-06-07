"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";

export default function PaymentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCart(getCart());
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert("Please upload payment proof");
      return;
    }

    const checkout = JSON.parse(localStorage.getItem("checkout") || "{}");
    const currentCart = getCart();

    if (!checkout.name || !checkout.phone || !checkout.address) {
      alert("Missing checkout information");
      window.location.href = "/checkout";
      return;
    }

    if (currentCart.length === 0) {
      alert("Cart is empty");
      window.location.href = "/products";
      return;
    }

    setLoading(true);

    const orderTotal = currentCart.reduce(
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: checkout.name,
        phone: checkout.phone,
        address: checkout.address,
        total_price: orderTotal,
        status: "pending",
        payment_proof_url: publicUrlData.publicUrl,
      })
      .select()
      .single();

    if (orderError) {
      alert(orderError.message);
      setLoading(false);
      return;
    }

    const orderItems = currentCart.map((item) => ({
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
    window.dispatchEvent(new Event("cartUpdated"));
    localStorage.removeItem("checkout");

    window.location.href = `/orders/${order.id}`;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Payment
          </h1>

          <p className="mt-3 text-gray-700">
            Complete your payment, then upload the receipt to submit your order.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              Payment Instructions
            </h2>

            <div className="rounded-3xl bg-gray-50 p-6 text-center">
              <p className="mb-4 font-bold text-gray-900">
                Scan QR Code to Pay
              </p>

              <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border border-gray-200 bg-white font-bold text-gray-500">
                QR CODE
              </div>

              <p className="mt-5 text-sm leading-6 text-gray-700">
                After completing the payment, upload a clear image or PDF of
                the payment receipt.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-black file:mr-4 file:rounded-xl file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-semibold file:text-white"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? "Submitting..." : "Confirm Payment"}
              </button>
            </form>
          </div>

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
              href="/checkout"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              Back to Checkout
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}