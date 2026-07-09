"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

type CartItemWithVariant = CartItem & {
  cart_key?: string;
  product_name?: string;
  variant_id?: number | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
};

export default function PaymentPage() {
  const { lang } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<any>({});

  useEffect(() => {
    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) {
      localStorage.setItem("redirect_after_login", "/payment");
      window.location.href = "/profile?account_required=1";
      return;
    }

    const savedCheckout = localStorage.getItem("checkout");

    if (!savedCheckout) {
      window.location.href = "/checkout";
      return;
    }

    setCart(getCart() as CartItemWithVariant[]);
    setCheckout(JSON.parse(savedCheckout));

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

  function getCartItemKey(item: CartItemWithVariant) {
    return item.cart_key || `${item.id}-${item.variant_id || "base"}`;
  }

  function getVariantLabel(item: CartItemWithVariant) {
    return lang === "ar"
      ? item.variant_label_ar || item.variant_label_en
      : item.variant_label_en || item.variant_label_ar;
  }

  function getDisplayName(item: CartItemWithVariant) {
    const variantLabel = getVariantLabel(item);

    if (item.product_name) return item.product_name;

    if (variantLabel && item.name.includes(" - ")) {
      return item.name.split(" - ")[0];
    }

    return item.name;
  }

  const deliveryFee = Number(checkout.delivery_fee || 0);

  const productsTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const total = productsTotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      alert(
        lang === "ar"
          ? "يرجى رفع إثبات الدفع"
          : "Please upload payment proof"
      );
      return;
    }

    const checkout = JSON.parse(localStorage.getItem("checkout") || "{}");
    const currentCart = getCart() as CartItemWithVariant[];
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

    try {
      const productsTotal = currentCart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderTotal = productsTotal + deliveryFee;

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
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
        throw new Error(orderError.message);
      }

      const orderItems = currentCart.map((item) => {
        const variantLabel =
          item.variant_label_en || item.variant_label_ar || null;

        return {
          order_id: order.id,
          product_id: item.id,

          product_name: item.product_name || item.name,

          variant_id: item.variant_id || null,
          variant_label_ar: item.variant_label_ar || null,
          variant_label_en: item.variant_label_en || null,

          image_url: item.image_url || null,

          quantity: item.quantity,
          unit_price: item.price,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      saveCart([]);
      window.dispatchEvent(new Event("cartUpdated"));
      localStorage.removeItem("checkout");

      window.location.href = `/orders/${order.id}`;
    } catch (err: any) {
      alert(err.message || "Something went wrong");
      setLoading(false);
    }
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
              ? "أكمل الدفع ثم ارفع الإيصال لإرسال الطلب."
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
                {lang === "ar" ? "امسح رمز QR للدفع" : "Scan QR Code to Pay"}
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
                  ? "بعد إتمام الدفع، ارفع صورة واضحة أو ملف PDF لإيصال الدفع."
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
                cart.map((item) => {
                  const itemKey = getCartItemKey(item);
                  const variantLabel = getVariantLabel(item);
                  const displayName = getDisplayName(item);

                  return (
                    <div
                      key={itemKey}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div className="flex gap-3">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-gray-900">
                            {displayName}
                          </p>

                          {variantLabel && (
                            <p className="mt-1 text-xs font-extrabold text-green-700">
                              {lang === "ar" ? "الخيار: " : "Option: "}
                              {variantLabel}
                            </p>
                          )}

                          <p className="mt-1 text-gray-700">
                            {lang === "ar" ? "الكمية" : "Qty"}: {item.quantity}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {item.price.toLocaleString()} SYP
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-green-700">
                        {(item.price * item.quantity).toLocaleString()} SYP
                      </p>
                    </div>
                  );
                })
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