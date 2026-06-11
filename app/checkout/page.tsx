"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart } from "@/lib/cart";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    setCart(getCart());
    loadDeliveryData();
  }, []);

  async function loadDeliveryData() {
    const { data: govData, error: govError } = await supabase
      .from("delivery_fees")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (govError) {
      alert(govError.message);
      return;
    }

    const { data: areaData, error: areaError } = await supabase
      .from("delivery_areas")
      .select("*")
      .eq("is_active", true)
      .order("area_name", { ascending: true });

    if (areaError) {
      alert(areaError.message);
      return;
    }

    

    const { data: settingData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "free_shipping_threshold")
      .single();

    setGovernorates(govData || []);
    setDeliveryAreas(areaData || []);
    setFreeShippingThreshold(Number(settingData?.value || 0));
  }

  const productsTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const areasForGovernorate = deliveryAreas.filter(
    (area) => area.governorate === governorate
  );

  const selectedArea = deliveryAreas.find(
    (area) => String(area.id) === deliveryArea
  );

  const rawDeliveryFee = Number(selectedArea?.delivery_fee || 0);

  const hasFreeShipping =
    freeShippingThreshold > 0 && productsTotal >= freeShippingThreshold;

  const deliveryFee = hasFreeShipping ? 0 : rawDeliveryFee;

  const total = productsTotal + deliveryFee;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!governorate) {
      alert("Please select governorate");
      return;
    }

    if (!deliveryArea) {
      alert("Please select delivery area");
      return;
    }

    localStorage.setItem(
      "checkout",
      JSON.stringify({
        name,
        phone,
        governorate,
        delivery_area: selectedArea?.area_name || "",
        address,
        delivery_fee: deliveryFee,
      })
    );

    window.location.href = "/payment";
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">Checkout</h1>

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

              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setDeliveryArea("");
                }}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-black outline-none transition focus:border-green-600"
              >
                <option value="">Select Governorate</option>

                {governorates.map((item) => (
                  <option key={item.id} value={item.governorate}>
                    {item.governorate}
                  </option>
                ))}
              </select>

              <select
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                required
                disabled={!governorate}
                className="w-full rounded-2xl border border-gray-300 p-4 text-black outline-none transition focus:border-green-600 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {governorate ? "Select Area" : "Select governorate first"}
                </option>

                {areasForGovernorate.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.area_name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Delivery Address Details"
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
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="mt-1 text-gray-700">Qty: {item.quantity}</p>
                    </div>

                    <p className="font-bold text-green-700">
                      {(item.price * item.quantity).toLocaleString()} SYP
                    </p>
                  </div>
                ))
              )}
            </div>

            {freeShippingThreshold > 0 && (
              <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800">
                Free delivery for orders above{" "}
                {freeShippingThreshold.toLocaleString()} SYP
              </div>
            )}

            <div className="mt-4 space-y-3 border-b border-gray-200 pb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Products</span>
                <span>{productsTotal.toLocaleString()} SYP</span>
              </div>

              <div className="flex justify-between font-bold text-gray-800">
                <span>Delivery</span>
                <span>
                  {hasFreeShipping
                    ? "Free"
                    : `${deliveryFee.toLocaleString()} SYP`}
                </span>
              </div>
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