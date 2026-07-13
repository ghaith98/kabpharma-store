"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

const MAX_PAYMENT_PROOF_SIZE = 5 * 1024 * 1024;

const ALLOWED_PAYMENT_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

type CartItemWithVariant = CartItem & {
  cart_key?: string;
  product_name?: string;
  variant_id?: number | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
};

type CheckoutData = {
  name?: string;
  phone?: string;
  governorate?: string;
  delivery_area?: string;
  address?: string;
  delivery_fee?: number | string;
};

export default function PaymentPage() {
  const { lang } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData>({});

  const isArabic = lang === "ar";

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

    try {
      const parsedCheckout = JSON.parse(savedCheckout) as CheckoutData;

      setCheckout(parsedCheckout);
      setCart(getCart() as CartItemWithVariant[]);
    } catch (error) {
      console.error("Failed to read checkout information:", error);

      localStorage.removeItem("checkout");
      window.location.href = "/checkout";
      return;
    }

    async function loadPaymentSettings() {
      const { data: qrData, error: qrError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_qr_url")
        .single();

      if (!qrError && qrData?.value) {
        setQrUrl(qrData.value);
      }

      const { data: numberData, error: numberError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "payment_number")
        .single();

      if (!numberError && numberData?.value) {
        setPaymentNumber(numberData.value);
      }
    }

    loadPaymentSettings();
  }, []);

  function getCartItemKey(item: CartItemWithVariant) {
    return item.cart_key || `${item.id}-${item.variant_id || "base"}`;
  }

  function getVariantLabel(item: CartItemWithVariant) {
    return isArabic
      ? item.variant_label_ar || item.variant_label_en
      : item.variant_label_en || item.variant_label_ar;
  }

  function getDisplayName(item: CartItemWithVariant) {
    const variantLabel = getVariantLabel(item);

    if (item.product_name) {
      return item.product_name;
    }

    if (variantLabel && item.name.includes(" - ")) {
      return item.name.split(" - ")[0];
    }

    return item.name;
  }

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function validatePaymentProof(selectedFile: File) {
    if (!ALLOWED_PAYMENT_PROOF_TYPES.includes(selectedFile.type)) {
      alert(
        isArabic
          ? "نوع الملف غير مسموح. يرجى رفع صورة JPG أو PNG أو WEBP أو ملف PDF."
          : "Unsupported file type. Please upload JPG, PNG, WEBP, or PDF."
      );

      return false;
    }

    if (selectedFile.size > MAX_PAYMENT_PROOF_SIZE) {
      alert(
        isArabic
          ? "حجم الملف كبير جداً. الحد الأقصى المسموح هو 5 ميغابايت."
          : "The file is too large. The maximum allowed size is 5 MB."
      );

      return false;
    }

    if (selectedFile.size === 0) {
      alert(
        isArabic
          ? "الملف المختار فارغ. يرجى اختيار ملف آخر."
          : "The selected file is empty. Please choose another file."
      );

      return false;
    }

    return true;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!validatePaymentProof(selectedFile)) {
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  const deliveryFee = Number(checkout.delivery_fee || 0);

  const productsTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const total = productsTotal + deliveryFee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!file) {
      alert(
        isArabic
          ? "يرجى رفع إثبات الدفع."
          : "Please upload payment proof."
      );

      return;
    }

    if (!validatePaymentProof(file)) {
      return;
    }

    const savedCheckout = localStorage.getItem("checkout");

    if (!savedCheckout) {
      alert(
        isArabic
          ? "معلومات الطلب غير موجودة. يرجى العودة وإدخالها من جديد."
          : "Checkout information is missing. Please enter it again."
      );

      window.location.href = "/checkout";
      return;
    }

    let currentCheckout: CheckoutData;

    try {
      currentCheckout = JSON.parse(savedCheckout) as CheckoutData;
    } catch {
      localStorage.removeItem("checkout");

      alert(
        isArabic
          ? "تعذر قراءة معلومات الطلب. يرجى إدخالها من جديد."
          : "Checkout information could not be read. Please enter it again."
      );

      window.location.href = "/checkout";
      return;
    }

    const currentCart = getCart() as CartItemWithVariant[];

    const currentDeliveryFee = Number(
      currentCheckout.delivery_fee || 0
    );

    if (
      !currentCheckout.name ||
      !currentCheckout.phone ||
      !currentCheckout.governorate ||
      !currentCheckout.delivery_area ||
      !currentCheckout.address
    ) {
      alert(
        isArabic
          ? "معلومات الطلب غير مكتملة."
          : "Checkout information is incomplete."
      );

      window.location.href = "/checkout";
      return;
    }

    if (currentCart.length === 0) {
      alert(isArabic ? "السلة فارغة." : "Your cart is empty.");

      window.location.href = "/products";
      return;
    }

    setLoading(true);

    let createdOrderId: number | null = null;

    try {
      const currentProductsTotal = currentCart.reduce(
        (sum, item) =>
          sum + Number(item.price) * Number(item.quantity),
        0
      );

      const orderTotal =
        currentProductsTotal + currentDeliveryFee;

      const safeFileName = file.name
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .slice(-120);

      const uniqueFileId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const filePath = `orders/${Date.now()}-${uniqueFileId}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          isArabic
            ? `تعذر رفع إثبات الدفع: ${uploadError.message}`
            : `Could not upload payment proof: ${uploadError.message}`
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: currentCheckout.name.trim(),
          phone: currentCheckout.phone.trim(),
          governorate: currentCheckout.governorate,
          delivery_area: currentCheckout.delivery_area,
          address: currentCheckout.address.trim(),
          delivery_fee: currentDeliveryFee,
          total_price: orderTotal,
          status: "pending",

          payment_proof_url: publicUrlData.publicUrl,
          payment_proof_path: filePath,

          payment_proof_reviewed_at: null,
          delivered_at: null,
          payment_proof_deleted_at: null,
        })
        .select()
        .single();

      if (orderError || !order) {
        throw new Error(
          isArabic
            ? `تعذر إنشاء الطلب: ${
                orderError?.message || "Unknown error"
              }`
            : `Could not create the order: ${
                orderError?.message || "Unknown error"
              }`
        );
      }

      createdOrderId = Number(order.id);

      const orderItems = currentCart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.product_name || item.name,
        variant_id: item.variant_id || null,
        variant_label_ar: item.variant_label_ar || null,
        variant_label_en: item.variant_label_en || null,
        image_url: item.image_url || null,
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        throw new Error(
          isArabic
            ? `تعذر حفظ منتجات الطلب: ${itemsError.message}`
            : `Could not save order items: ${itemsError.message}`
        );
      }

      saveCart([]);
      window.dispatchEvent(new Event("cartUpdated"));
      localStorage.removeItem("checkout");

      window.location.href = `/orders/${order.id}`;
    } catch (error: unknown) {
      /*
        إذا تم إنشاء الطلب ثم فشل حفظ المنتجات،
        نحاول إزالة الطلب غير المكتمل.
      */
      if (createdOrderId !== null) {
        const { error: deleteOrderError } = await supabase
          .from("orders")
          .delete()
          .eq("id", createdOrderId);

        if (deleteOrderError) {
          console.error(
            "Failed to delete incomplete order:",
            deleteOrderError
          );
        }
      }

      const message =
        error instanceof Error
          ? error.message
          : isArabic
          ? "حدث خطأ أثناء إرسال الطلب."
          : "Something went wrong while submitting the order.";

      alert(message);
      setLoading(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-gray-50 to-green-50 px-3 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-5xl">
        {/* Checkout progress */}
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
              {isArabic ? "معلومات الطلب" : "Checkout"}
            </a>

            <span className="text-green-700">
              {isArabic ? "الدفع" : "Payment"}
            </span>
          </div>
        </div>

        {/* Page header */}
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {isArabic ? "الدفع" : "Payment"}
          </h1>

          <p className="mt-3 text-gray-700">
            {isArabic
              ? "أكمل الدفع ثم ارفع الإيصال لإرسال الطلب."
              : "Complete your payment, then upload the receipt to submit your order."}
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Payment instructions */}
          <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {isArabic ? "تعليمات الدفع" : "Payment Instructions"}
            </h2>

            <div className="rounded-3xl bg-gray-50 p-4 text-center sm:p-6">
              <p className="mb-4 font-bold text-gray-900">
                {isArabic
                  ? "امسح رمز QR للدفع"
                  : "Scan QR Code to Pay"}
              </p>

              <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm sm:max-w-[320px]">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={
                      isArabic
                        ? "رمز الدفع"
                        : "Payment QR Code"
                    }
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-gray-500">
                    {isArabic
                      ? "لم يتم رفع رمز QR بعد"
                      : "QR Code not uploaded yet"}
                  </span>
                )}
              </div>

              {paymentNumber && (
                <div className="mx-auto mt-5 w-full max-w-[280px] rounded-2xl border border-gray-200 bg-white p-3 sm:max-w-[320px]">
                  <p className="mb-2 text-center text-xs font-bold text-gray-700">
                    {isArabic ? "رقم الدفع" : "Payment Number"}
                  </p>

                  <div
                    className="flex items-center justify-between gap-2"
                    dir="ltr"
                  >
                    <span className="min-w-0 flex-1 break-all text-center font-mono text-sm font-bold text-gray-900">
                      {paymentNumber}
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            paymentNumber
                          );

                          setCopied(true);

                          setTimeout(() => {
                            setCopied(false);
                          }, 1400);
                        } catch {
                          alert(
                            isArabic
                              ? "تعذر نسخ الرقم."
                              : "Could not copy the number."
                          );
                        }
                      }}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                        copied
                          ? "bg-green-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {copied
                        ? "✓"
                        : isArabic
                        ? "نسخ"
                        : "Copy"}
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm leading-6 text-gray-700">
                {isArabic
                  ? "بعد إتمام الدفع، ارفع صورة واضحة أو ملف PDF لإيصال الدفع."
                  : "After completing the payment, upload a clear image or PDF of the payment receipt."}
              </p>

              <p className="mt-2 text-xs font-semibold text-gray-500">
                {isArabic
                  ? "الأنواع المسموحة: JPG وPNG وWEBP وPDF — الحد الأقصى 5 MB."
                  : "Allowed: JPG, PNG, WEBP, and PDF — maximum 5 MB."}
              </p>
            </div>

            {/* Upload form */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <label className="block cursor-pointer">
                <div
                  className={`overflow-hidden rounded-2xl border bg-white transition ${
                    file
                      ? "border-green-300 ring-1 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="shrink-0 bg-green-600 px-4 py-4 font-semibold text-white">
                      {isArabic ? "اختر ملف" : "Choose File"}
                    </span>

                    <span className="min-w-0 flex-1 truncate px-4 text-gray-600">
                      {file
                        ? file.name
                        : isArabic
                        ? "لم يتم اختيار ملف"
                        : "No file chosen"}
                    </span>
                  </div>

                  {file && (
                    <div className="border-t border-green-100 bg-green-50 px-4 py-2 text-xs font-semibold text-green-800">
                      {isArabic ? "حجم الملف:" : "File size:"}{" "}
                      {formatFileSize(file.size)}
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  required
                  className="hidden"
                />
              </label>

              {file && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setFile(null)}
                  className="text-sm font-bold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                >
                  {isArabic
                    ? "إزالة الملف المختار"
                    : "Remove selected file"}
                </button>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading
                  ? isArabic
                    ? "جاري رفع الإيصال وإرسال الطلب..."
                    : "Uploading receipt and submitting order..."
                  : isArabic
                  ? "تأكيد الدفع"
                  : "Confirm Payment"}
              </button>
            </form>
          </div>

          {/* Order summary */}
          <aside className="h-fit rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              {isArabic ? "ملخص الطلب" : "Order Summary"}
            </h2>

            <div className="mt-5 space-y-4 border-b border-gray-200 pb-4">
              {cart.length === 0 ? (
                <p className="text-gray-700">
                  {isArabic
                    ? "السلة فارغة"
                    : "Your cart is empty"}
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
                      <div className="flex min-w-0 gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
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

                        <div className="min-w-0">
                          <p className="break-words font-bold text-gray-900">
                            {displayName}
                          </p>

                          {variantLabel && (
                            <p className="mt-1 text-xs font-extrabold text-green-700">
                              {isArabic ? "الخيار: " : "Option: "}
                              {variantLabel}
                            </p>
                          )}

                          <p className="mt-1 text-gray-700">
                            {isArabic ? "الكمية" : "Qty"}:{" "}
                            {item.quantity}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {Number(item.price).toLocaleString()} SYP
                          </p>
                        </div>
                      </div>

                      <p className="shrink-0 font-bold text-green-700">
                        {(
                          Number(item.price) *
                          Number(item.quantity)
                        ).toLocaleString()}{" "}
                        SYP
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 space-y-3 border-b border-gray-200 pb-4">
              <div className="flex justify-between font-bold text-gray-800">
                <span>{isArabic ? "المنتجات" : "Products"}</span>

                <span>
                  {productsTotal.toLocaleString()} SYP
                </span>
              </div>

              <div className="flex justify-between font-bold text-gray-800">
                <span>{isArabic ? "التوصيل" : "Delivery"}</span>

                <span>{deliveryFee.toLocaleString()} SYP</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-4 text-lg font-extrabold text-gray-900">
              <span>{isArabic ? "الإجمالي" : "Total"}</span>

              <span className="text-green-700">
                {total.toLocaleString()} SYP
              </span>
            </div>

            <a
              href="/checkout"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              {isArabic
                ? "العودة إلى معلومات الطلب"
                : "Back to Checkout"}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}