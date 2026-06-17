"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

export default function PaymentPage() {
  const { lang } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<any>({});

  useEffect(() => {
    setCart(getCart());

    const savedCheckout = localStorage.getItem("checkout");
    if (savedCheckout) {
      setCheckout(JSON.parse(savedCheckout));
    }

    async function loadQr() {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_qr_url")
        .single();

      if (!error && data?.value) {
        setQrUrl(data.value);
      }

      const { data: numberData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_number")
        .single();

      if (numberData?.value) {
        setPaymentNumber(numberData.value);
      }
    }

    loadQr();
  }, []);

  const deliveryFee = Number(checkout.delivery_fee || 0);

  const productsTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = productsTotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert(lang === "ar" ? "يرجى رفع إثبات الدفع" : "Please upload payment proof");
      return;
    }

    const checkout = JSON.parse(localStorage.getItem("checkout") || "{}");
    const currentCart = getCart();
    const deliveryFee = Number(checkout.delivery_fee || 0);

    if (
      !checkout.name ||
      !checkout.phone ||
      !checkout.governorate ||
      !checkout.delivery_area ||
      !checkout.address
    ) {
      alert(
        lang === "ar"
          ? "معلومات الطلب غير مكتملة"
          : "Missing checkout information"
      );
      window.location.href = "/checkout";
      return;
    }

    if (currentCart.length === 0) {
      alert(lang === "ar" ? "السلة فارغة" : "Cart is empty");
      window.location.href = "/products";
      return;
    }

    setLoading(true);

    const productsTotal = currentCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderTotal = productsTotal + deliveryFee;

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
        governorate: checkout.governorate,
        delivery_area: checkout.delivery_area,
        address: checkout.address,
        delivery_fee: deliveryFee,
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
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-green-50 px-3 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-10 max-w-xl">
          <div className="flex items-center" dir="ltr">
            <a
              href="/checkout"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white transition hover:bg-green-700"
            >
              ✓
            </a>

            <div className="h-1 flex-1 bg-green-600" />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-sm font-extrabold text-white">
              2
            </div>
          </div>

          <div className="mt-3 flex justify-between text-sm font-bold">
            <a href="/checkout" className="text-green-700">
              {lang === "ar" ? "معلومات الطلب" : "Checkout"}
            </a>
            <span className="text-green-700">
              {lang === "ar" ? "الدفع" : "Payment"}
            </span>
          </div>
        </div>

        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "الدفع" : "Payment"}
          </h1>

          <p className="mt-3 text-gray-700">
            {lang === "ar"
              ? "أكملي الدفع ثم ارفعي الإيصال لإرسال الطلب."
              : "Complete your payment, then upload the receipt to submit your order."}
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {lang === "ar" ? "تعليمات الدفع" : "Payment Instructions"}
            </h2>

            <div className="rounded-3xl bg-gray-50 p-4 text-center sm:p-6">
              <p className="mb-4 font-bold text-gray-900">
                {lang === "ar" ? "امسحي رمز QR للدفع" : "Scan QR Code to Pay"}
              </p>

              <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm sm:max-w-[320px]">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Payment QR Code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-gray-500">
                    {lang === "ar"
                      ? "لم يتم رفع رمز QR بعد"
                      : "QR Code not uploaded yet"}
                  </span>
                )}
              </div>

              {paymentNumber && (
                <div className="mx-auto mt-5 w-full max-w-[280px] rounded-2xl border border-gray-200 bg-white p-3 sm:max-w-[320px]">
                  <p className="mb-2 text-center text-xs font-bold text-gray-700">
                    {lang === "ar" ? "رقم الدفع" : "Payment Number"}
                  </p>

                  <div className="flex items-center justify-between gap-2" dir="ltr">
                    <span className="min-w-0 flex-1 break-all text-center font-mono text-sm font-bold text-gray-900">
                      {paymentNumber}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentNumber);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                        copied
                          ? "bg-green-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {copied ? "✓" : lang === "ar" ? "نسخ" : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm leading-6 text-gray-700">
                {lang === "ar"
                  ? "بعد إتمام الدفع، ارفعي صورة واضحة أو ملف PDF لإيصال الدفع."
                  : "After completing the payment, upload a clear image or PDF of the payment receipt."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block cursor-pointer">
  <div className="flex items-center overflow-hidden rounded-2xl border border-gray-300 bg-white">
    <span className="bg-green-600 px-4 py-4 font-semibold text-white">
      {lang === "ar" ? "اختر ملف" : "Choose File"}
    </span>

    <span className="flex-1 truncate px-4 text-gray-600">
      {file
        ? file.name
        : lang === "ar"
        ? "لم يتم اختيار ملف"
        : "No file chosen"}
    </span>
  </div>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => setFile(e.target.files?.[0] || null)}
    required
    className="hidden"
  />
</label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading
                  ? lang === "ar"
                    ? "جاري الإرسال..."
                    : "Submitting..."
                  : lang === "ar"
                    ? "تأكيد الدفع"
                    : "Confirm Payment"}
              </button>
            </form>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-4 shadow-sm sm:p-6">
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
                <span>{deliveryFee.toLocaleString()} SYP</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-lg font-extrabold text-gray-900">
              <span>{lang === "ar" ? "الإجمالي" : "Total"}</span>

              <span className="text-green-700">
                {total.toLocaleString()} SYP
              </span>
            </div>

            <a
              href="/checkout"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              {lang === "ar" ? "العودة إلى معلومات الطلب" : "Back to Checkout"}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}