"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Hash,
  LockKeyhole,
  Package,
  QrCode,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

const COD_FEE = 50;
const COD_IDEMPOTENCY_KEY = "kab_cod_idempotency_key";
const TRANSFER_IDEMPOTENCY_KEY = "kab_transfer_idempotency_key";

type PaymentMethod = "sham_cash" | "cod";

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

type StoredUser = {
  full_name?: string;
  phone?: string;
};

export default function PaymentPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const isArabic = lang === "ar";

  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("sham_cash");
  const [transactionId, setTransactionId] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  function t(en: string, ar: string) { return isArabic ? ar : en; }

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentSettings() {
      const [qrResult, numberResult] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "payment_qr_url").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "payment_number").maybeSingle(),
      ]);
      if (qrResult.data?.value) setQrUrl(qrResult.data.value);
      if (numberResult.data?.value) setPaymentNumber(numberResult.data.value);
    }
    async function initializePayment() {
      try {
        const response = await fetch("/api/customer/me", { credentials: "include", cache: "no-store" });
        if (response.status === 401) {
          localStorage.removeItem("kab_user");
          localStorage.setItem("redirect_after_login", "/payment");
          router.replace("/profile?account_required=1");
          return;
        }
        if (!response.ok) throw new Error("Account check failed");
        const result = (await response.json()) as { user?: StoredUser };
        localStorage.setItem("kab_user", JSON.stringify(result.user || {}));
        const savedCheckout = localStorage.getItem("checkout");
        if (!savedCheckout) { router.replace("/checkout"); return; }
        const parsedCheckout = JSON.parse(savedCheckout) as CheckoutData;
        if (cancelled) return;
        setCheckout(parsedCheckout);
        setCart(getCart() as CartItemWithVariant[]);
        setPageReady(true);
        await loadPaymentSettings();
      } catch (error) {
        console.error("Failed to initialize payment:", error);
        localStorage.removeItem("checkout");
        router.replace("/checkout");
      }
    }
    const timer = window.setTimeout(() => void initializePayment(), 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [router]);

  function formatPrice(value: number) {
    return `${Math.round(Number(value || 0)).toLocaleString()} SYP`;
  }

  function getCartItemKey(item: CartItemWithVariant) {
    return item.cart_key || `${item.id}-${item.variant_id || "base"}`;
  }

  function getVariantLabel(item: CartItemWithVariant) {
    return isArabic ? item.variant_label_ar || item.variant_label_en : item.variant_label_en || item.variant_label_ar;
  }

  function getDisplayName(item: CartItemWithVariant) {
    const variantLabel = getVariantLabel(item);
    if (item.product_name) return item.product_name;
    if (variantLabel && item.name.includes(" - ")) return item.name.split(" - ")[0];
    return item.name;
  }

  async function copyPaymentNumber() {
    try {
      await navigator.clipboard.writeText(paymentNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      alert(t("Could not copy the payment number.", "تعذر نسخ رقم الدفع."));
    }
  }

  const deliveryFee = Number(checkout.delivery_fee || 0);
  const productsTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const total = Math.max(0, productsTotal - (appliedCoupon?.discountAmount || 0)) + deliveryFee + (paymentMethod === "cod" ? COD_FEE : 0);
  const itemsCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const deliveryLocation = [checkout.delivery_area, checkout.governorate].filter(Boolean).join("، ");

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError(t("Enter a coupon code.", "أدخلي كود الخصم.")); return; }
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const response = await fetch("/api/customer/coupons/validate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: productsTotal }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || "Coupon validation failed");
      setAppliedCoupon(result.coupon);
      setCouponInput(result.coupon.code);
      sessionStorage.removeItem(COD_IDEMPOTENCY_KEY);
      sessionStorage.removeItem(TRANSFER_IDEMPOTENCY_KEY);
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(error instanceof Error ? error.message : t("Could not validate the coupon.", "تعذر التحقق من الكوبون."));
    } finally { setCheckingCoupon(false); }
  }

  function clearCoupon() {
    setCouponInput(""); setAppliedCoupon(null); setCouponError(""); setCouponOpen(false);
    sessionStorage.removeItem(COD_IDEMPOTENCY_KEY);
    sessionStorage.removeItem(TRANSFER_IDEMPOTENCY_KEY);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (paymentMethod === "sham_cash") {
      const cleanId = transactionId.trim();
      if (!cleanId) { setTransactionError(t("Please enter your Shamcash transaction number.", "يرجى إدخال رقم عملية شام كاش.")); return; }
      if (!/^\d{6,15}$/.test(cleanId)) { setTransactionError(t("Transaction number must be digits only (6–15 digits).", "رقم العملية يجب أن يحتوي على أرقام فقط (6-15 رقم).")); return; }
      setTransactionError("");
    }

    const savedCheckout = localStorage.getItem("checkout");
    if (!savedCheckout) {
      alert(t("Checkout information is missing. Please enter it again.", "معلومات الطلب غير موجودة. يرجى إدخالها من جديد."));
      router.replace("/checkout"); return;
    }

    let currentCheckout: CheckoutData;
    try {
      currentCheckout = JSON.parse(savedCheckout) as CheckoutData;
    } catch {
      localStorage.removeItem("checkout");
      alert(t("Checkout information could not be read. Please enter it again.", "تعذر قراءة معلومات الطلب. يرجى إدخالها من جديد."));
      router.replace("/checkout"); return;
    }

    const normalizedCheckout = {
      name: String(currentCheckout.name || "").replace(/\s+/g, " ").trim(),
      governorate: String(currentCheckout.governorate || "").trim(),
      delivery_area: String(currentCheckout.delivery_area || "").trim(),
      address: String(currentCheckout.address || "").replace(/\s+/g, " ").trim(),
    };

    const currentCart = getCart() as CartItemWithVariant[];

    if (normalizedCheckout.name.length < 2 || !normalizedCheckout.governorate || !normalizedCheckout.delivery_area || normalizedCheckout.address.length < 5) {
      alert(t("Some delivery information is incomplete. Please review your name, governorate, area and address.", "بعض معلومات التوصيل غير مكتملة."));
      router.replace("/checkout"); return;
    }

    if (currentCart.length === 0) {
      alert(t("Your cart is empty.", "السلة فارغة."));
      router.replace("/products"); return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "cod") {
        const existingKey = sessionStorage.getItem(COD_IDEMPOTENCY_KEY);
        const idempotencyKey = existingKey || crypto.randomUUID();
        sessionStorage.setItem(COD_IDEMPOTENCY_KEY, idempotencyKey);

        const response = await fetch("/api/customer/orders/cod", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkout: { name: normalizedCheckout.name, governorate: normalizedCheckout.governorate, delivery_area: normalizedCheckout.delivery_area, address: normalizedCheckout.address },
            cart: currentCart.map((item) => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: item.quantity })),
            ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
            idempotencyKey,
          }),
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          if (response.status === 401) { localStorage.setItem("redirect_after_login", "/payment"); router.replace("/login"); return; }
          throw new Error(result?.error || result?.message || t("Could not place your cash-on-delivery order.", "تعذر تأكيد طلب الدفع عند الاستلام."));
        }

        saveCart([]);
        window.dispatchEvent(new Event("cartUpdated"));
        localStorage.removeItem("checkout");
        sessionStorage.removeItem(COD_IDEMPOTENCY_KEY);
        router.replace(`/orders/${result.orderId}`);
        return;
      }

      // Shamcash
      const existingTransferKey = sessionStorage.getItem(TRANSFER_IDEMPOTENCY_KEY);
      const transferIdempotencyKey = existingTransferKey || crypto.randomUUID();
      sessionStorage.setItem(TRANSFER_IDEMPOTENCY_KEY, transferIdempotencyKey);

      const response = await fetch("/api/customer/orders", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout: { name: normalizedCheckout.name, governorate: normalizedCheckout.governorate, delivery_area: normalizedCheckout.delivery_area, address: normalizedCheckout.address },
          cart: currentCart.map((item) => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: item.quantity })),
          shamcashTransactionId: transactionId.trim(),
          ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
          idempotencyKey: transferIdempotencyKey,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        if (response.status === 401) { localStorage.setItem("redirect_after_login", "/payment"); router.replace("/login"); return; }
        throw new Error(result?.error || result?.message || t("The order could not be created.", "تعذر إنشاء الطلب."));
      }

      saveCart([]);
      window.dispatchEvent(new Event("cartUpdated"));
      localStorage.removeItem("checkout");
      sessionStorage.removeItem(TRANSFER_IDEMPOTENCY_KEY);
      router.replace(`/orders/${result.orderId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("Something went wrong while submitting the order.", "حدث خطأ أثناء إرسال الطلب.");
      alert(message);
      setLoading(false);
    }
  }

  if (!pageReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#dfe4e0] border-t-[#0a583b]" />
          <p className="mt-4 text-sm font-bold text-[#647168]">{t("Loading payment details...", "جاري تحميل معلومات الدفع...")}</p>
        </div>
      </main>
    );
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-x-hidden bg-[#f7f8f6] px-4 py-8 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:pb-16">
      <div className="mx-auto max-w-[1280px]">

        {/* Progress */}
        <nav aria-label={t("Checkout progress", "مراحل إتمام الطلب")} className="max-w-[470px]">
          <div dir="ltr" className="flex items-center">
            <Link href="/checkout" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a583b] text-white transition hover:bg-[#073f2c]">
              <Check size={16} strokeWidth={2.4} />
            </Link>
            <div className="h-px flex-1 bg-[#0a583b]" />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a583b] text-xs font-extrabold text-white">2</div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-5 text-xs font-extrabold">
            <Link href="/checkout" className="text-[#647168] transition hover:text-[#0a583b]">{t("Delivery", "معلومات التوصيل")}</Link>
            <span className="text-[#0a583b]">{t("Payment", "الدفع")}</span>
          </div>
        </nav>

        {/* Header */}
        <header className="mt-9 flex flex-col gap-6 border-b border-[#dfe4e0] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div>
            <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.18em]"}`}>KAB Pharma</p>
            <h1 className={`mt-3 font-extrabold text-[#142019] ${isArabic ? "text-4xl leading-tight [font-family:var(--font-arabic)] sm:text-5xl" : "text-4xl tracking-[-0.045em] sm:text-6xl"}`}>
              {t("Complete payment", "إتمام الدفع")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
              {t("Transfer your order total via Sham Cash, then enter the transaction number to confirm your order instantly.", "حوّل قيمة الطلب عبر شام كاش، ثم أدخل رقم العملية لتأكيد طلبك فوراً.")}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cbd3cd] bg-white px-4 py-2.5 text-xs font-bold text-[#526057]">
            <LockKeyhole size={15} className="text-[#0a583b]" />
            <span>{t("Secure order confirmation", "تأكيد طلب آمن")}</span>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">

          {/* Left: Payment */}
          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">

            {/* Payment method */}
            <div className="border-b border-[#e7ebe8] p-5 sm:p-7">
              <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>{t("Payment method", "طريقة الدفع")}</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019]">{t("Choose a payment method", "اختر طريقة الدفع")}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="cursor-pointer">
                  <input type="radio" name="payment-method" value="sham_cash" checked={paymentMethod === "sham_cash"} onChange={() => setPaymentMethod("sham_cash")} className="sr-only" />
                  <span className={`block min-h-[104px] rounded-2xl border p-4 transition ${paymentMethod === "sham_cash" ? "border-[#0a583b] bg-[#edf5f0]" : "border-[#dfe4e0] bg-white hover:border-[#8fb5a0]"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-extrabold text-[#142019]">{t("Sham Cash", "شام كاش")}</span>
                      <span className={`h-4 w-4 shrink-0 rounded-full border ${paymentMethod === "sham_cash" ? "border-[5px] border-[#0a583b]" : "border-[#9aa39d]"}`} />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[#647168]">
                      {t("Scan the QR or transfer to the number, then enter your transaction ID.", "امسح الرمز أو حوّل إلى الرقم، ثم أدخل رقم العملية.")}
                    </span>
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="payment-method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="sr-only" />
                  <span className={`block min-h-[104px] rounded-2xl border p-4 transition ${paymentMethod === "cod" ? "border-[#0a583b] bg-[#edf5f0]" : "border-[#dfe4e0] bg-white hover:border-[#8fb5a0]"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-extrabold text-[#142019]">{t("Cash on delivery", "الدفع عند الاستلام")}</span>
                      <span className={`h-4 w-4 shrink-0 rounded-full border ${paymentMethod === "cod" ? "border-[5px] border-[#0a583b]" : "border-[#9aa39d]"}`} />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[#647168]">{t(`Additional service fee: ${formatPrice(COD_FEE)}`, `رسوم خدمة إضافية ${formatPrice(COD_FEE)}`)}</span>
                  </span>
                </label>
              </div>
            </div>

            {paymentMethod === "sham_cash" ? (
              <>
                {/* QR + steps */}
                <div className="grid gap-7 p-5 sm:p-7 md:grid-cols-[270px_minmax(0,1fr)] md:items-center">
                  <div className="flex aspect-square w-full max-w-[300px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4">
                    {qrUrl ? (
                      <Image src={qrUrl} alt={t("Payment QR code", "رمز QR للدفع")} width={600} height={600} sizes="(max-width: 768px) 90vw, 300px" className="h-full w-full object-contain" />
                    ) : (
                      <div className="px-5 text-center">
                        <QrCode size={32} strokeWidth={1.5} className="mx-auto text-[#8a948d]" />
                        <p className="mt-4 text-sm font-bold text-[#647168]">{t("Payment QR code is currently unavailable.", "رمز الدفع غير متوفر حالياً.")}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">1</div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#142019]">{t("Scan the QR code", "امسح رمز QR")}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#647168]">{t("Open your Sham Cash app and scan the code to complete the transfer.", "افتح تطبيق شام كاش وامسح الرمز لإتمام عملية التحويل.")}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">2</div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#142019]">{t("Transfer the order total", "حوّل المبلغ الإجمالي")}</h3>
                        <p className="mt-1 text-2xl font-extrabold text-[#0a583b]">{formatPrice(total)}</p>
                      </div>
                    </div>
                    {paymentNumber && (
                      <div className="mt-6 rounded-[1.25rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a857e]">{t("Payment number", "رقم الدفع")}</p>
                        <div dir="ltr" className="mt-2 flex min-w-0 items-center gap-3">
                          <span className="min-w-0 flex-1 break-all font-mono text-sm font-extrabold text-[#142019]">{paymentNumber}</span>
                          <button type="button" onClick={copyPaymentNumber} className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold transition ${copied ? "bg-[#0a583b] text-white" : "border border-[#cbd3cd] bg-white text-[#142019] hover:border-[#0a583b] hover:text-[#0a583b]"}`}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction ID input */}
                <div className="border-t border-[#e7ebe8] p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">3</div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#142019]">{t("Enter your transaction number", "أدخل رقم العملية")}</h2>
                      <p className="mt-1 text-sm leading-6 text-[#647168]">{t("After transferring, enter the transaction number from your Sham Cash app. Your order will be confirmed instantly.", "بعد التحويل، أدخل رقم العملية من تطبيق شام كاش. سيتم تأكيد طلبك فوراً.")}</p>
                    </div>
                  </div>

                  <form id="payment-proof-form" onSubmit={handleSubmit} className="mt-5">
                    <div className={`flex items-center overflow-hidden rounded-2xl border transition ${transactionError ? "border-red-300 bg-red-50/60" : "border-[#dfe4e0] bg-white focus-within:border-[#0a583b] focus-within:ring-4 focus-within:ring-[#edf5f0]"}`}>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-[#dfe4e0] bg-[#f7f8f6]">
                        <Hash size={18} className="text-[#0a583b]" />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        value={transactionId}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => { setTransactionId(e.target.value.replace(/\D/g, "")); setTransactionError(""); }}
                        placeholder={t("e.g. 123456789", "مثال: 123456789")}
                        maxLength={15}
                        disabled={loading}
                        className="min-w-0 flex-1 bg-transparent py-4 pe-4 text-base font-bold text-[#142019] outline-none placeholder:text-[#a2aaa4] disabled:opacity-50"
                      />
                    </div>
                    {transactionError && <p role="alert" className="mt-2 text-xs font-bold leading-5 text-red-600">{transactionError}</p>}

                    <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f7f8f6] px-4 py-3">
                      <LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#0a583b]" />
                      <p className="text-xs leading-5 text-[#647168]">
                        {t("Your transaction is verified automatically and securely via the Sham Cash API.", "يتم التحقق من عمليتك تلقائياً وبشكل آمن عبر واجهة شام كاش.")}
                      </p>
                    </div>

                    {/* Desktop submit */}
                    <button type="submit" disabled={loading || !transactionId.trim()} className="mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex">
                      {loading ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Verifying & placing order...", "جاري التحقق وإرسال الطلب...")}</span></>
                      ) : (
                        <><ShieldCheck size={17} /><span>{t("Verify & confirm order", "تحقق وأكّد الطلب")}</span></>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // COD
              <div className="p-5 sm:p-7">
                <div className="rounded-[1.5rem] border border-[#b8d7c4] bg-[#edf5f0] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0a583b]"><Truck size={19} /></div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#142019]">{t("Cash on delivery", "الدفع عند الاستلام")}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#526057]">{t("Pay the delivery representative when your order arrives. No payment proof is required.", "ادفع قيمة الطلب لمندوب التوصيل عند استلامه. لا تحتاج إلى رفع إثبات دفع.")}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#b8d7c4] pt-4 text-sm">
                    <span className="font-bold text-[#0a583b]">{t("Cash on delivery service fee", "رسوم خدمة الدفع عند الاستلام")}</span>
                    <span className="font-extrabold text-[#0a583b]">{formatPrice(COD_FEE)}</span>
                  </div>
                </div>
                <form id="payment-proof-form" onSubmit={handleSubmit} className="mt-5">
                  <button type="submit" disabled={loading} className="hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex">
                    {loading ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Placing order...", "جاري تأكيد الطلب...")}</span></>
                    ) : (
                      <><ShieldCheck size={17} /><span>{t("Place cash on delivery order", "تأكيد طلب الدفع عند الاستلام")}</span></>
                    )}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* Right: Order summary */}
          <aside className="rounded-[1.75rem] border border-[#dfe4e0] bg-white p-5 sm:p-7 lg:sticky lg:top-8">
            <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>{t("Order summary", "ملخص الطلب")}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019]">{t(`${itemsCount} item${itemsCount !== 1 ? "s" : ""}`, `${itemsCount} منتج`)}</h2>

            <ul className="mt-5 space-y-4 border-b border-[#e7ebe8] pb-5">
              {cart.map((item) => {
                const variantLabel = getVariantLabel(item);
                const displayName = getDisplayName(item);
                return (
                  <li key={getCartItemKey(item)} className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e7ebe8] bg-[#f7f8f6]">
                     {item.image_url ? (
  <Image src={item.image_url} alt={displayName} fill className="object-contain p-1" sizes="56px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#b4bdb7]"><Package size={20} /></div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0a583b] px-1 text-[9px] font-extrabold text-white">{item.quantity}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[#142019]">{displayName}</p>
                      {variantLabel && <p className="mt-0.5 truncate text-xs text-[#7a857e]">{variantLabel}</p>}
                      <p className="mt-1 text-xs font-bold text-[#526057]">{formatPrice(Number(item.price || 0) * item.quantity)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Coupon */}
            <div className="border-b border-[#e7ebe8] py-4">
              {!couponOpen && !appliedCoupon ? (
                <button type="button" onClick={() => setCouponOpen(true)} className="flex w-full items-center justify-between gap-3 text-sm font-extrabold text-[#526057] transition hover:text-[#0a583b]">
                  <span className="flex items-center gap-2"><Tag size={16} strokeWidth={2} />{t("Have a discount code?", "لديك كود خصم؟")}</span>
                  <span className="text-xs font-bold">{t("Add", "إضافة")}</span>
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-[#142019]"><Tag size={16} strokeWidth={2} className="text-[#0a583b]" />{t("Discount code", "كود الخصم")}</p>
                    {appliedCoupon && <button type="button" onClick={clearCoupon} className="text-xs font-extrabold text-[#647168] transition hover:text-red-600">{t("Remove", "إزالة")}</button>}
                  </div>
                  {appliedCoupon ? (
                    <p className="mt-3 rounded-xl bg-[#edf5f0] px-3 py-2.5 text-xs font-extrabold text-[#0a583b]">{t(`${appliedCoupon.code} applied`, `تم تطبيق كود ${appliedCoupon.code}`)}</p>
                  ) : (
                    <>
                      <div className="mt-3 flex gap-2" dir="ltr">
                        <input value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }} maxLength={40} className="min-w-0 flex-1 rounded-xl border border-[#cbd3cd] bg-white px-3 py-2.5 text-sm font-bold uppercase text-[#142019] outline-none focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]" />
                        <button type="button" disabled={checkingCoupon} onClick={applyCoupon} className="rounded-xl bg-[#0a583b] px-4 text-xs font-extrabold text-white transition hover:bg-[#073f2c] disabled:bg-[#b4bdb7]">{checkingCoupon ? "..." : t("Apply", "تطبيق")}</button>
                      </div>
                      {couponError && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{couponError}</p>}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-4 text-[#526057]"><span>{t("Products", "المنتجات")}</span><span className="font-bold text-[#142019]">{formatPrice(productsTotal)}</span></div>
              {appliedCoupon && <div className="flex items-center justify-between gap-4 text-[#0a583b]"><span>{t(`Discount (${appliedCoupon.code})`, `خصم (${appliedCoupon.code})`)}</span><span className="font-bold">−{formatPrice(appliedCoupon.discountAmount)}</span></div>}
              <div className="flex items-center justify-between gap-4 text-[#526057]"><span>{t("Delivery", "التوصيل")}</span><span className="font-bold text-[#142019]">{deliveryFee > 0 ? formatPrice(deliveryFee) : t("Free", "مجاني")}</span></div>
              {paymentMethod === "cod" && <div className="flex items-center justify-between gap-4 text-[#526057]"><span className="text-[#0a583b]">{t("Cash on delivery fee", "رسوم الدفع عند الاستلام")}</span><span className="font-bold text-[#0a583b]">{formatPrice(COD_FEE)}</span></div>}
            </div>

            <div className="my-5 h-px bg-[#dfe4e0]" />
            <div className="flex items-end justify-between gap-4">
              <span className="font-extrabold text-[#142019]">{t("Total", "الإجمالي")}</span>
              <span className="text-xl font-extrabold text-[#0a583b]">{formatPrice(total)}</span>
            </div>

            {deliveryLocation && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f8f6] p-4">
                <Truck size={18} className="mt-0.5 shrink-0 text-[#0a583b]" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#142019]">{t("Delivering to", "التوصيل إلى")}</p>
                  <p className="mt-1 text-xs leading-5 text-[#647168]">{deliveryLocation}</p>
                  {checkout.address && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a857e]">{checkout.address}</p>}
                </div>
              </div>
            )}

            <Link href="/checkout" className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#526057] transition hover:text-[#0a583b]">
              <BackArrow size={14} className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              <span>{t("Edit delivery information", "تعديل معلومات الطلب")}</span>
            </Link>
          </aside>
        </div>
      </div>

      {/* Mobile submit */}
      <div dir={isArabic ? "rtl" : "ltr"} className="fixed inset-x-0 bottom-16 z-50 border-t border-[#dfe4e0] bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(20,32,25,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="min-w-0 shrink-0">
            <p className="text-[10px] font-bold text-[#7a857e]">{t("Total", "الإجمالي")}</p>
            <p className="mt-0.5 whitespace-nowrap text-sm font-extrabold text-[#142019]">{formatPrice(total)}</p>
          </div>
          <button
            type="submit"
            form="payment-proof-form"
            disabled={loading || (paymentMethod === "sham_cash" && !transactionId.trim())}
            className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#b4bdb7]"
          >
            {loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span className="truncate">{t("Submitting...", "جاري الإرسال...")}</span></>
            ) : (
              <><ShieldCheck size={16} /><span className="truncate">{paymentMethod === "cod" ? t("Place cash on delivery", "تأكيد طلب الدفع عند الاستلام") : t("Verify & confirm", "تحقق وأكّد")}</span></>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}