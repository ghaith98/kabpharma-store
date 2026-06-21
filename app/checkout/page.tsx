"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

export default function CheckoutPage() {
  const { lang } = useLanguage();

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

    const savedUser = localStorage.getItem("kab_user");
    if (!savedUser) {
  localStorage.setItem("redirect_after_login", "/checkout");
  window.location.href = "/profile?account_required=1";
  return;
}
    const savedCheckout = localStorage.getItem("checkout");

    if (savedCheckout) {
      const checkout = JSON.parse(savedCheckout);
      setName(checkout.name || "");
      setPhone(checkout.phone || "");
      setGovernorate(checkout.governorate || "");
      setAddress(checkout.address || "");
    } else if (savedUser) {
      const user = JSON.parse(savedUser);
      setName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, []);

  useEffect(() => {
    const savedCheckout = localStorage.getItem("checkout");

    if (savedCheckout && deliveryAreas.length > 0) {
      const checkout = JSON.parse(savedCheckout);
      const matchedArea = deliveryAreas.find(
        (area) =>
          area.area_name === checkout.delivery_area &&
          area.governorate === checkout.governorate
      );

      if (matchedArea) {
        setDeliveryArea(String(matchedArea.id));
      }
    }
  }, [deliveryAreas]);

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
      alert(lang === "ar" ? "السلة فارغة" : "Your cart is empty");
      return;
    }

    if (!governorate) {
      alert(lang === "ar" ? "يرجى اختيار المحافظة" : "Please select governorate");
      return;
    }

    if (!deliveryArea) {
      alert(lang === "ar" ? "يرجى اختيار منطقة التوصيل" : "Please select delivery area");
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
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-xl">
          <div className="flex items-center" dir="ltr">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white">
              1
            </div>

            <div className="h-1 flex-1 bg-gray-200" />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-extrabold text-gray-500">
              2
            </div>
          </div>

          <div className="mt-3 flex justify-between text-sm font-bold">
            <span className="text-green-700">
              {lang === "ar" ? "معلومات الطلب" : "Checkout"}
            </span>
            <span className="text-gray-500">
              {lang === "ar" ? "الدفع" : "Payment"}
            </span>
          </div>
        </div>

        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "إتمام الطلب" : "Checkout"}
          </h1>

          <p className="mt-3 text-gray-700">
            {lang === "ar"
              ? "أضيف تفاصيل التوصيل للمتابعة إلى الدفع."
              : "Add your delivery details to continue to payment."}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-8 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {lang === "ar" ? "معلومات التوصيل" : "Delivery Information"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={lang === "ar" ? "الاسم الكامل" : "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />

              <input
                type="tel"
                placeholder={lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />

              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setDeliveryArea("");
                }}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black outline-none transition focus:border-green-600"
              >
                <option value="">
                  {lang === "ar" ? "اختر المحافظة" : "Select Governorate"}
                </option>

                {governorates.map((item) => (
                  <option key={item.id} value={item.governorate}>
                    {lang === "ar"
  ? item.governorate_ar || item.governorate
  : item.governorate_en || item.governorate}
                  </option>
                ))}
              </select>

              <select
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                required
                disabled={!governorate}
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black outline-none transition focus:border-green-600 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {governorate
                    ? lang === "ar"
                      ? "اختر المنطقة"
                      : "Select Area"
                    : lang === "ar"
                      ? "اختر المحافظة أولاً"
                      : "Select governorate first"}
                </option>

                {areasForGovernorate.map((area) => (
                  <option key={area.id} value={area.id}>
  {lang === "ar"
    ? area.area_name_ar || area.area_name
    : area.area_name_en || area.area_name}
</option>
                ))}
              </select>

              <textarea
                placeholder={
                  lang === "ar"
                    ? "تفاصيل عنوان التوصيل"
                    : "Delivery Address Details"
                }
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={5}
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700"
            >
              {lang === "ar" ? "المتابعة إلى الدفع" : "Continue To Payment"}
            </button>
          </form>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900">
              {lang === "ar" ? "ملخص الطلب" : "Order Summary"}
            </h2>

            <div className="mt-5 space-y-4 border-b border-gray-200 pb-4">
              {cart.length === 0 ? (
                <p className="text-gray-700">
                  {lang === "ar" ? "السلة فارغة" : "Your cart is empty"}
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="mt-1 text-gray-700">
                        {lang === "ar" ? "الكمية" : "Qty"}: {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-green-700">
                      {(item.price * item.quantity).toLocaleString()} SYP
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3 border-b border-gray-200 pb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>{lang === "ar" ? "المنتجات" : "Products"}</span>
                <span>{productsTotal.toLocaleString()} SYP</span>
              </div>

              <div className="flex justify-between font-bold text-gray-800">
                <span>{lang === "ar" ? "التوصيل" : "Delivery"}</span>
                <span>
                  {hasFreeShipping
                    ? lang === "ar"
                      ? "مجاني"
                      : "Free"
                    : `${deliveryFee.toLocaleString()} SYP`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-lg font-extrabold text-gray-900">
              <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>
              <span className="text-green-700">
                {total.toLocaleString()} SYP
              </span>
            </div>

            <a
              href="/cart"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              {lang === "ar" ? "العودة إلى السلة" : "Back to Cart"}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}