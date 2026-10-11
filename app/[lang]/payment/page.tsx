"use client";

import { checkoutAccountId, clearCheckoutDraft, clearCheckoutSession, readCheckoutDraft } from "@/lib/checkout-session";
import { useCheckoutAccountGuard } from "@/lib/use-checkout-account-guard";

import Link from "next/link";
import BackLink from "@/app/BackLink";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Hash,
  LockKeyhole,
  LoaderCircle,
  Package,
  QrCode,
  ShieldCheck,
  Tag,
  Truck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "@/context/LanguageContext";
import { trackCheckoutStart, trackPurchase } from "@/lib/analytics";
import { COD_FEE_SYP } from "@/lib/commerce-config";
import { quoteIssueText, useCartQuote } from "@/lib/use-cart-quote";

// Shown before the customer picks cash on delivery; the charged fee always
// comes from the server.
const COD_FEE = COD_FEE_SYP;
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
  id?: number | string;
  full_name?: string;
  phone?: string;
};

export default function PaymentPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const isArabic = lang === "ar";

  const [profileId, setProfileId] = useState<string | null>(null);


  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  // false until the QR / number have been read, so the layout is chosen once.
  const [paymentSettingsLoaded, setPaymentSettingsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutData>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("sham_cash");
  const [transactionId, setTransactionId] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  // The code the customer asked for. Whether it really applies is decided
  // by the server together with the rest of the order (see `appliedCoupon`).
  const [requestedCoupon, setRequestedCoupon] = useState<string | null>(null);
  const [couponInputError, setCouponInputError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  useCheckoutAccountGuard(profileId, () => {
    setCheckout({}); setCart([]); setPageReady(false); setCouponInput(""); setRequestedCoupon(null); setTransactionId("");
  });

  /*
    Every amount on this page comes from the server: prices, promotions,
    free items, coupon, delivery, cash-on-delivery fee and the total.
    The order is then placed with the same calculation, so the total shown
    here is the total charged.
  */
  const pricing = useCartQuote(cart, {
    couponCode: requestedCoupon,
    governorate: checkout.governorate || null,
    deliveryArea: checkout.delivery_area || null,
    paymentMethod: paymentMethod === "cod" ? "cod" : "transfer",
    enabled: pageReady,
  });
  const quote = pricing.quote;

  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  function t(en: string, ar: string) { return isArabic ? ar : en; }

  useEffect(() => {
    let cancelled = false;
    async function loadPaymentSettings() {
      const [qrResult, numberResult] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "payment_qr_url").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "payment_number").maybeSingle(),
      ]);
      if (cancelled) return;
      if (qrResult.data?.value) setQrUrl(qrResult.data.value);
      if (numberResult.data?.value) setPaymentNumber(numberResult.data.value);
      setPaymentSettingsLoaded(true);
    }
    async function initializePayment() {
      try {
        const response = await fetch("/api/customer/me", { credentials: "include", cache: "no-store" });
        if (response.status === 401) {
          clearCheckoutSession();
          localStorage.removeItem("kab_user");
          localStorage.setItem("redirect_after_login", "/payment");
          router.replace("/profile?account_required=1");
          return;
        }
        if (!response.ok) throw new Error("Account check failed");
        const result = (await response.json()) as { user?: StoredUser };
        if (cancelled) return;
        const verifiedId = checkoutAccountId(result.user?.id);
        if (!verifiedId) throw new Error("Account check failed");
        setProfileId(verifiedId);
        localStorage.setItem("kab_user", JSON.stringify(result.user || {}));
        const parsedCheckout = readCheckoutDraft<CheckoutData>(localStorage, verifiedId);
        if (!parsedCheckout) { router.replace("/checkout"); return; }
        setCheckout(parsedCheckout);
        setCart(getCart() as CartItemWithVariant[]);
        setPageReady(true);
        const initialCart = getCart() as CartItemWithVariant[];
        trackCheckoutStart(initialCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
        await loadPaymentSettings();
      } catch (error) {
        console.error("Failed to initialize payment:", error);
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

  // The cart with the server's prices written in.
  const pricedCart = cart.map((item) => {
    const line = pricing.lineFor(item);
    return line ? { ...item, price: line.unitPrice } : item;
  });

  const estimatedProductsTotal = pricedCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const productsTotal = quote ? quote.totals.subtotal : estimatedProductsTotal;

  const promotions = quote ? quote.promotions : [];
  const paidPromotions = promotions.filter((promotion) => promotion.kind === "line_discount");
  const freePromotions = promotions.filter((promotion) => promotion.kind === "free_items");
  type AppliedPromotion = (typeof promotions)[number];

  // Applied = the server accepted this exact code for this exact order.
  const couponOutcome = requestedCoupon && quote?.coupon?.code === requestedCoupon ? quote.coupon : null;
  const appliedCoupon = couponOutcome?.applied ? couponOutcome : null;
  const checkingCoupon = Boolean(requestedCoupon) && pricing.updating;
  const couponDiscount = quote ? quote.totals.couponDiscount : 0;

  const deliveryFee = quote && quote.delivery.fee != null ? quote.delivery.fee : Number(checkout.delivery_fee || 0);
  const codFee = paymentMethod === "cod" ? (quote ? quote.totals.codFee || COD_FEE : COD_FEE) : 0;

  // Only a fresh answer is shown as the amount to pay.
  const totalReady = pricing.fresh && quote != null;
  const total = quote ? quote.totals.total : 0;
  const totalText = totalReady ? formatPrice(total) : "…";

  // No QR to show: hidden in Admin > Payment Settings, or never uploaded.
  // Decided only after the settings are read, so the layout does not jump.
  const withoutQr = paymentSettingsLoaded && !qrUrl;

  const paymentNumberBox = paymentNumber ? (
    <div className={`rounded-[1.25rem] border border-[#dfe4e0] bg-[#f7f8f6] p-3 lg:p-4 ${withoutQr ? "mt-3 max-w-md lg:mt-4" : "mt-6"}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a857e]">{t("Payment number", "رقم الدفع")}</p>
      <div dir="ltr" className="mt-2 flex min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1 break-all font-mono text-xs font-extrabold sm:text-sm text-[#142019]">{paymentNumber}</span>
        <button type="button" onClick={copyPaymentNumber} className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold transition ${copied ? "bg-[#0a583b] text-white" : "border border-[#cbd3cd] bg-white text-[#142019] hover:border-[#0a583b] hover:text-[#0a583b]"}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}</span>
        </button>
      </div>
    </div>
  ) : null;

  const itemsCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const freeItemsCount = quote ? quote.totals.freeItemsCount : 0;
  const displayedItemsCount = itemsCount + freeItemsCount;
  const deliveryLocation = [checkout.delivery_area, checkout.governorate].filter(Boolean).join("، ");

  const unavailableItem = cart.find((item) => pricing.issueFor(item) != null);

  function promotionKey(promotion: AppliedPromotion) {
    return `${promotion.promotionId}-${promotion.productId}-${promotion.variantId ?? "base"}-${promotion.kind}`;
  }

  function promotionDescription(promotion: AppliedPromotion) {
    const item = cart.find((candidate) => pricing.lineFor(candidate)?.key === `${promotion.productId}-${promotion.variantId ?? "base"}`);
    const productName = item?.product_name || item?.name || (isArabic ? "هذا المنتج" : "This product");
    return `${productName}: ${isArabic ? promotion.labelAr : promotion.labelEn}`;
  }

  // Why the requested coupon is not applied, in the customer's language.
  function couponProblemText() {
    if (!requestedCoupon || !pricing.fresh || !quote || appliedCoupon) return "";

    if (quote.couponError === "not_assigned") return t("This coupon is not available for your account.", "هذا الكوبون غير مخصص لحسابك.");
    if (quote.couponError === "first_order_only") return t("This coupon is for your first order only.", "هذا الكوبون متاح للطلب الأول فقط.");
    if (quote.couponError === "invalid") return t("This coupon code is not valid.", "كود الخصم غير صحيح أو غير مفعّل.");
    if (quote.couponError === "not_valid_now") return t("This coupon is not valid at the moment.", "هذا الكود غير صالح حالياً.");
    if (quote.couponError === "already_used") return t("This coupon has already been used on your account.", "تم استخدام هذا الكود سابقاً على حسابكِ.");

    const reason = couponOutcome?.reason;
    if (reason === "minimum_not_met") {
      const minimum = formatPrice(couponOutcome?.minimumOrderAmount || 0);
      return t(`This coupon needs an order of at least ${minimum}.`, `هذا الكود يتطلب طلباً بقيمة ${minimum} على الأقل.`);
    }
    if (reason === "no_eligible_items") return t("This coupon does not apply to the items in your cart.", "هذا الكود لا ينطبق على المنتجات الموجودة في سلتكِ.");
    if (reason === "delivery_already_free") return t("Delivery is already free for this order, so this coupon was not used.", "التوصيل مجاني لهذا الطلب أصلاً، لذلك لم يُستخدم الكود.");

    return t("This coupon could not be applied.", "تعذر تطبيق هذا الكود.");
  }

  const couponError = couponInputError || couponProblemText();

  function resetIdempotencyKeys() {
    sessionStorage.removeItem(COD_IDEMPOTENCY_KEY);
    sessionStorage.removeItem(TRANSFER_IDEMPOTENCY_KEY);
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) { setCouponInputError(t("Enter a coupon code.", "أدخلي كود الخصم.")); return; }
    setCouponInputError("");
    setCouponInput(code);
    setRequestedCoupon(code);
    resetIdempotencyKeys();
  }

  function clearCoupon() {
    setCouponInput(""); setRequestedCoupon(null); setCouponInputError("");
    resetIdempotencyKeys();
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

    let currentCheckout: CheckoutData | null;
    try {
      const response = await fetch("/api/customer/me", {cache:"no-store",credentials:"include"});
      if (!response.ok) throw new Error("Could not verify the current account. Please sign in again.");
      const user = (await response.json()).user;
      if (!profileId || checkoutAccountId(user?.id) !== profileId) {
        setCheckout({}); setPageReady(false); resetIdempotencyKeys();
        alert(t("Your account changed. Please review delivery details for the current account.", "تغيّر الحساب. يرجى مراجعة بيانات التوصيل للحساب الحالي."));
        window.location.reload(); return;
      }
      currentCheckout = readCheckoutDraft<CheckoutData>(localStorage, profileId);
    } catch {
      alert(t("Could not verify your account. Please try again.", "تعذر التحقق من حسابك. يرجى المحاولة مرة أخرى."));
      return;
    }
    if (!currentCheckout) {
      setCheckout({}); setPageReady(false);
      alert(t("Checkout information is missing. Please enter it again.", "معلومات الطلب غير موجودة. يرجى إدخالها من جديد."));
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

    if (unavailableItem) {
      alert(t("Some items in your cart are no longer available. Please remove them from your cart to continue.", "بعض المنتجات في السلة لم تعد متوفرة. يرجى إزالتها من السلة للمتابعة."));
      router.replace("/cart"); return;
    }

    if (quote && pricing.fresh && quote.deliveryAreaFound === false) {
      alert(t("This delivery area is no longer available. Please choose it again.", "منطقة التوصيل لم تعد متاحة. يرجى اختيارها من جديد."));
      router.replace("/checkout"); return;
    }

    // Never place an order with a total the customer has not seen.
    if (!quote || !pricing.fresh) {
      if (pricing.failed) pricing.retry();
      alert(t("The order total is still being calculated. Please try again in a moment.", "ما زال إجمالي الطلب قيد الحساب. يرجى المحاولة بعد لحظات."));
      return;
    }

    // The same prices the customer is looking at, held for 30 minutes.
    const pricedOrder = {
      priceToken: quote.priceToken,
      expectedTotal: quote.totals.total,
      ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
    };

    // The server answered that prices changed since this page was priced.
    const handleTotalChanged = (result: { code?: string; total?: number } | null) => {
      if (result?.code !== "TOTAL_CHANGED") return false;
      resetIdempotencyKeys();
      pricing.retry();
      const newTotal = formatPrice(Number(result.total || 0));
      alert(
        t(
          `Prices have changed since you opened this page. The new order total is ${newTotal}. Please review it before confirming.`,
          `تغيّرت الأسعار منذ فتح هذه الصفحة. إجمالي الطلب الجديد هو ${newTotal}. يرجى مراجعته قبل التأكيد.`
        ) +
          (paymentMethod === "sham_cash"
            ? t(
                " If you have already transferred the previous amount, please contact us and we will sort it out.",
                " إذا كنتِ قد حوّلتِ المبلغ السابق، يرجى التواصل معنا لنساعدكِ."
              )
            : "")
      );
      setLoading(false);
      return true;
    };

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
            checkoutProfileId: profileId,
            checkout: { name: normalizedCheckout.name, governorate: normalizedCheckout.governorate, delivery_area: normalizedCheckout.delivery_area, address: normalizedCheckout.address },
            cart: currentCart.map((item) => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: item.quantity })),
            ...pricedOrder,
            idempotencyKey,
          }),
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          if (result?.code === "ACCOUNT_CHANGED") { setCheckout({}); setPageReady(false); resetIdempotencyKeys(); window.location.reload(); return; }
          if (handleTotalChanged(result)) return;
          if (response.status === 401) { localStorage.setItem("redirect_after_login", "/payment"); router.replace("/login"); return; }
          throw new Error(result?.error || result?.message || t("Could not place your cash-on-delivery order.", "تعذر تأكيد طلب الدفع عند الاستلام."));
        }

        saveCart([]);
        trackPurchase();
        window.dispatchEvent(new Event("cartUpdated"));
        clearCheckoutDraft(localStorage, profileId);
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
          checkoutProfileId: profileId,
          checkout: { name: normalizedCheckout.name, governorate: normalizedCheckout.governorate, delivery_area: normalizedCheckout.delivery_area, address: normalizedCheckout.address },
          cart: currentCart.map((item) => ({ id: item.id, variant_id: item.variant_id ?? null, quantity: item.quantity })),
          shamcashTransactionId: transactionId.trim(),
          ...pricedOrder,
          idempotencyKey: transferIdempotencyKey,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        if (result?.code === "ACCOUNT_CHANGED") { setCheckout({}); setPageReady(false); resetIdempotencyKeys(); window.location.reload(); return; }
        if (handleTotalChanged(result)) return;
        if (response.status === 401) { localStorage.setItem("redirect_after_login", "/payment"); router.replace("/login"); return; }
        throw new Error(result?.error || result?.message || t("The order could not be created.", "تعذر إنشاء الطلب."));
      }

      saveCart([]);
      trackPurchase();
      window.dispatchEvent(new Event("cartUpdated"));
      clearCheckoutDraft(localStorage, profileId);
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
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-x-hidden bg-[#f7f8f6] px-4 py-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:py-12 lg:pb-16">
      <div className="mx-auto max-w-[1280px]">

        {/* Progress */}
        <nav aria-label={t("Checkout progress", "مراحل إتمام الطلب")} className="hidden max-w-[470px] lg:block">
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
        <header className="flex items-end justify-between gap-4 pb-4 lg:mt-9 lg:border-b lg:border-[#dfe4e0] lg:pb-10">
          <div>
            <p className={`hidden text-[11px] font-extrabold uppercase text-[#0a583b] lg:block ${isArabic ? "tracking-normal" : "tracking-[0.18em]"}`}>KAB Pharma</p>
            <h1 className={`font-extrabold text-[#142019] lg:mt-3 ${isArabic ? "text-2xl leading-tight [font-family:var(--font-arabic)] lg:text-5xl" : "text-2xl tracking-[-0.045em] lg:text-6xl"}`}>
              {t("Complete payment", "إتمام الدفع")}
            </h1>
            <p className="mt-3 hidden max-w-xl text-base leading-7 text-[#647168] lg:block">
              {t("Transfer your order total via Sham Cash, then enter the transaction number to confirm your order instantly.", "حوّل قيمة الطلب عبر شام كاش، ثم أدخل رقم العملية لتأكيد طلبك فوراً.")}
            </p>
          </div>
          <div className="hidden w-fit items-center gap-2 rounded-full lg:inline-flex border border-[#cbd3cd] bg-white px-4 py-2.5 text-xs font-bold text-[#526057]">
            <LockKeyhole size={15} className="text-[#0a583b]" />
            <span>{t("Secure order confirmation", "تأكيد طلب آمن")}</span>
          </div>
        </header>

        <div className="grid gap-4 lg:mt-8 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">

          {/* Order summary: first on mobile, sidebar on desktop. */}
          <aside className="order-1 flex min-w-0 flex-col rounded-2xl border border-[#dfe4e0] bg-white p-4 lg:order-2 lg:sticky lg:top-8 lg:rounded-[1.75rem] lg:p-7">
            <div className="order-1 lg:order-none">
              <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>{t("Order summary", "ملخص الطلب")}</p>
              <h2 className="mt-2 hidden text-2xl font-extrabold tracking-tight text-[#142019] lg:block">{t(`${displayedItemsCount} item${displayedItemsCount !== 1 ? "s" : ""}`, `${displayedItemsCount} منتج`)}</h2>
              <button type="button" aria-expanded={summaryOpen} aria-controls="order-summary-products order-summary-prices" onClick={() => setSummaryOpen(!summaryOpen)} className="mt-2 flex min-h-10 w-full items-center justify-between gap-3 text-sm lg:hidden">
                <span className="text-start font-bold text-[#526057]">{t(`${displayedItemsCount} item${displayedItemsCount !== 1 ? "s" : ""}`, `${displayedItemsCount} منتج`)}<span className="mt-0.5 block text-xs font-medium text-[#647168]">{summaryOpen ? t("Hide details", "إخفاء التفاصيل") : t("View details", "عرض التفاصيل")}</span></span>
                <span className="flex items-center gap-2 font-extrabold text-[#0a583b]">{totalText}<ChevronDown size={16} className={`shrink-0 transition-transform ${summaryOpen ? "rotate-180" : ""}`} aria-hidden="true" /></span>
              </button>
            </div>
            <div id="order-summary-products" className={`order-3 lg:order-none lg:block ${summaryOpen ? "" : "hidden"}`}>
            <ul className="mt-5 space-y-4 border-b border-[#e7ebe8] pb-5">
              {pricedCart.map((item) => {
                const variantLabel = getVariantLabel(item);
                const displayName = getDisplayName(item);
                const line = pricing.lineFor(item);
                const issue = pricing.issueFor(item);
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
                      {(() => {
                        const lineTotal = Number(item.price || 0) * item.quantity;
                        const lineDiscount = line?.promotionDiscount || 0;
                        return lineDiscount > 0 ? (
                          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs font-bold">
                            <span className="text-[#99a29c] line-through">{formatPrice(lineTotal)}</span>
                            <span className="text-[#0a583b]">{formatPrice(Math.max(0, lineTotal - lineDiscount))}</span>
                            {line?.promotion && <span className="text-[#0a583b]">· {isArabic ? line.promotion.label.ar : line.promotion.label.en}</span>}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs font-bold text-[#526057]">{formatPrice(lineTotal)}</p>
                        );
                      })()}
                      {issue && <p className="mt-1 text-xs font-bold leading-5 text-red-700">{quoteIssueText(issue, isArabic)}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>

            </div>

            {/* Coupon */}
            <section aria-labelledby="coupon-heading" className="order-2 py-3 lg:order-none lg:border-b lg:border-[#e7ebe8] lg:py-5">
              <div className="rounded-2xl border border-[#dfe7e1] bg-[#f7f9f6] p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0e9] text-[#0a583b]" aria-hidden="true"><Tag size={18} strokeWidth={1.8} /></span>
                  <h3 id="coupon-heading" className="text-sm font-extrabold text-[#142019]">{t("Discount code", "كود الخصم")}</h3>
                </div>
                {appliedCoupon ? (
                  <div role="status" className="mt-3 rounded-xl border border-[#c9dfce] bg-[#edf5f0] p-3">
                    <div className="flex items-start gap-2 text-[#0a583b]">
                      <Check size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-extrabold"><bdi>{appliedCoupon.code}</bdi></p>
                        <p className="mt-1 text-xs font-medium leading-5">{appliedCoupon.type === "free_delivery" ? t("Applied · Free delivery", "تم التطبيق · توصيل مجاني") : t(`Applied · You save ${formatPrice(couponDiscount)}`, `تم التطبيق · وفّرتِ ${formatPrice(couponDiscount)}`)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={clearCoupon} className="mt-2 min-h-9 rounded-lg px-2 text-xs font-bold text-[#526057] underline underline-offset-4 transition hover:text-[#0a583b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a583b]">{t("Remove code", "إزالة الكود")}</button>
                  </div>
                ) : (
                  <>
                    <p id="coupon-help" className="mt-2 text-xs leading-5 text-[#647168]">{t("Have a code? Enter it below to apply your discount.", "لديكِ كود خصم؟ أدخليه هنا لتطبيق الخصم على طلبكِ.")}</p>
                    <label htmlFor="checkout-coupon" className="sr-only">{t("Discount code", "كود الخصم")}</label>
                    <div className="mt-3 flex min-w-0 gap-2">
                      <input
                        id="checkout-coupon"
                        dir="ltr"
                        value={couponInput}
                        placeholder={t("Enter code", "أدخلي الكود")}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        aria-invalid={Boolean(couponError)}
                        aria-describedby={couponError ? "coupon-help coupon-error" : "coupon-help"}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponInputError(""); if (requestedCoupon) setRequestedCoupon(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (!checkingCoupon) applyCoupon(); } }}
                        maxLength={40}
                        className={`h-12 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm font-bold text-[#142019] outline-none transition placeholder:font-normal placeholder:text-[#7a857e] focus:border-[#0a583b] focus:ring-2 focus:ring-[#0a583b]/15 ${couponError ? "border-red-400" : "border-[#cbd3cd]"}`}
                      />
                      <button type="button" disabled={checkingCoupon} onClick={applyCoupon} aria-busy={checkingCoupon} className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0a583b] px-4 text-sm font-extrabold text-white transition hover:bg-[#073f2c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a583b] disabled:cursor-wait disabled:opacity-65">
                        {checkingCoupon && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
                        {checkingCoupon ? t("Applying", "جارٍ التطبيق") : t("Apply", "تطبيق")}
                      </button>
                    </div>
                    {couponError && <p id="coupon-error" role="alert" className="mt-2 text-xs font-medium leading-5 text-red-700">{couponError}</p>}
                  </>
                )}
              </div>
            </section>

            {/* The server could not be reached for the prices. */}
            {pricing.failed && (
              <div role="alert" className="order-4 mt-3 flex items-center justify-between gap-3 rounded-xl bg-red-50 lg:order-none px-3 py-2.5 text-xs font-bold text-red-700">
                <span>{t("The order total could not be calculated.", "تعذر حساب إجمالي الطلب.")}</span>
                <button type="button" onClick={pricing.retry} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-extrabold text-red-700 ring-1 ring-red-200">{t("Try again", "إعادة المحاولة")}</button>
              </div>
            )}

            {unavailableItem && <div role="alert" className="order-4 mt-3 text-xs font-bold leading-5 text-red-700 lg:order-none">{t("Some items need your attention.", "بعض المنتجات تحتاج مراجعة.")}<button type="button" onClick={() => setSummaryOpen(true)} className="ms-2 min-h-9 underline lg:hidden">{t("View items", "عرض المنتجات")}</button></div>}
            <div id="order-summary-prices" className={`order-4 lg:order-none lg:block ${summaryOpen ? "" : "hidden"}`}>
            {/* Totals */}
            <div className="mt-5 space-y-3.5 text-sm">
              <div className="flex items-center justify-between gap-4 text-[#526057]"><span>{t("Products", "المنتجات")}</span><span className="font-bold text-[#142019]">{formatPrice(productsTotal)}</span></div>
              {freePromotions.map((promotion) => <div key={promotionKey(promotion)} className="flex items-center justify-between gap-4 text-[#0a583b]"><span>{promotionDescription(promotion)}</span><span className="font-bold">+{promotion.affectedQuantity} {t("free", "مجاناً")}</span></div>)}
              {paidPromotions.map((promotion) => <div key={promotionKey(promotion)} className="flex items-center justify-between gap-4 text-[#0a583b]"><span>{promotionDescription(promotion)}</span><span className="font-bold">−{formatPrice(promotion.discountAmount)}</span></div>)}
              {appliedCoupon && couponDiscount > 0 && <div className="flex items-center justify-between gap-4 text-[#0a583b]"><span>{t(`Coupon (${appliedCoupon.code})`, `كود الخصم (${appliedCoupon.code})`)}</span><span className="font-bold">−{formatPrice(couponDiscount)}</span></div>}
              <div className="flex items-center justify-between gap-4 text-[#526057]"><span>{t("Delivery", "التوصيل")}</span><span className="font-bold text-[#142019]">{deliveryFee > 0 ? formatPrice(deliveryFee) : t("Free", "مجاني")}</span></div>
              {paymentMethod === "cod" && <div className="flex items-center justify-between gap-4 text-[#526057]"><span className="text-[#0a583b]">{t("Cash on delivery fee", "رسوم الدفع عند الاستلام")}</span><span className="font-bold text-[#0a583b]">{formatPrice(codFee)}</span></div>}
            </div>

            <div className="my-5 h-px bg-[#dfe4e0]" />
            <div className="flex items-end justify-between gap-4">
              <span className="font-extrabold text-[#142019]">{t("Total", "الإجمالي")}</span>
              <span className="text-xl font-extrabold text-[#0a583b]">{totalText}</span>
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

            <BackLink href="/checkout" onlyFrom="/checkout" className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#526057] transition hover:text-[#0a583b]">
              <BackArrow size={14} className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              <span>{t("Edit delivery information", "تعديل معلومات الطلب")}</span>
            </BackLink>
            </div>
          </aside>

          {/* Left: Payment */}
          <section className="order-2 min-w-0 overflow-hidden rounded-2xl lg:order-1 lg:rounded-[1.75rem] border border-[#dfe4e0] bg-white">

            {/* Payment method */}
            <div className="border-b border-[#e7ebe8] p-4 lg:p-7">
              <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>{t("Payment method", "طريقة الدفع")}</p>
              <h2 className="mt-2 hidden text-2xl font-extrabold tracking-tight text-[#142019] lg:block">{t("Choose a payment method", "اختر طريقة الدفع")}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-5 lg:gap-3">
                <label className="min-w-0 cursor-pointer">
                  <input type="radio" name="payment-method" value="sham_cash" checked={paymentMethod === "sham_cash"} onChange={() => setPaymentMethod("sham_cash")} className="peer sr-only" />
                  <span className={`block h-full min-h-[92px] rounded-xl border p-3 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0a583b] lg:min-h-[104px] lg:rounded-2xl lg:p-4 ${paymentMethod === "sham_cash" ? "border-[#0a583b] bg-[#edf5f0]" : "border-[#dfe4e0] bg-white hover:border-[#8fb5a0]"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-extrabold leading-5 text-[#142019] lg:text-base">{t("Sham Cash", "شام كاش")}</span>
                      <span className={`h-4 w-4 shrink-0 rounded-full border ${paymentMethod === "sham_cash" ? "border-[5px] border-[#0a583b]" : "border-[#9aa39d]"}`} />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[#647168]">
                      <span className="lg:hidden">{t("Transfer via the app", "تحويل عبر التطبيق")}</span>
                      <span className="hidden lg:inline">{withoutQr
                        ? t("Transfer to our Sham Cash number, then enter your transaction ID.", "حوّل إلى رقم شام كاش الخاص بنا، ثم أدخل رقم العملية.")
                        : t("Scan the QR or transfer to the number, then enter your transaction ID.", "امسح الرمز أو حوّل إلى الرقم، ثم أدخل رقم العملية.")}</span>
                    </span>
                  </span>
                </label>
                <label className="min-w-0 cursor-pointer">
                  <input type="radio" name="payment-method" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="peer sr-only" />
                  <span className={`block h-full min-h-[92px] rounded-xl border p-3 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0a583b] lg:min-h-[104px] lg:rounded-2xl lg:p-4 ${paymentMethod === "cod" ? "border-[#0a583b] bg-[#edf5f0]" : "border-[#dfe4e0] bg-white hover:border-[#8fb5a0]"}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-extrabold leading-5 text-[#142019] lg:text-base">{t("Cash on delivery", "الدفع عند الاستلام")}</span>
                      <span className={`h-4 w-4 shrink-0 rounded-full border ${paymentMethod === "cod" ? "border-[5px] border-[#0a583b]" : "border-[#9aa39d]"}`} />
                    </span>
                    <span className="mt-1.5 block text-xs leading-5 text-[#647168]">{t(`Additional service fee: ${formatPrice(COD_FEE)}`, `رسوم خدمة إضافية ${formatPrice(COD_FEE)}`)}</span>
                  </span>
                </label>
              </div>
            </div>

            {paymentMethod === "sham_cash" ? (
              <>
                <div className="p-4 pb-0 lg:hidden">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-[#526057]">{t("Amount to transfer", "المبلغ المطلوب تحويله")}</span>
                    <span className="font-extrabold text-[#0a583b]">{totalText}</span>
                  </div>
                  {paymentNumberBox || (withoutQr && <p role="status" className="mt-3 text-xs leading-5 text-[#647168]">{t("The payment number is unavailable. Please choose cash on delivery.", "رقم الدفع غير متوفر حالياً. يرجى اختيار الدفع عند الاستلام.")}</p>)}
                  <details className="mt-3 rounded-xl border border-[#e7ebe8] px-3">
                    <summary className="cursor-pointer py-3 text-xs font-bold text-[#0a583b]">{withoutQr ? t("How to pay", "كيفية الدفع") : t("How to pay / Show QR", "كيفية الدفع / عرض QR")}</summary>
                    <p className="pb-3 text-xs leading-6 text-[#647168]">{t("Transfer the exact amount above in Sham Cash, then enter the transaction number from the app below.", "حوّل المبلغ الظاهر أعلاه عبر شام كاش، ثم أدخل رقم العملية من التطبيق في الحقل أدناه.")}</p>
                    {!withoutQr && qrUrl && <Image src={qrUrl} alt={t("Payment QR code", "رمز QR للدفع")} width={600} height={600} sizes="240px" className="mx-auto mb-3 h-auto w-full max-w-[240px] rounded-xl" />}
                  </details>
                </div>

                {/* QR + steps. With the QR hidden (Admin > Payment Settings)
                    or not uploaded, the steps use the full width and step 1
                    becomes "transfer to this number". */}
                <div className={`hidden gap-7 p-7 lg:grid ${withoutQr ? "" : "md:grid-cols-[270px_minmax(0,1fr)] md:items-center"}`}>
                  {!withoutQr && (
                    <div className="flex aspect-square w-full max-w-[300px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4">
                      {qrUrl ? (
                        <Image src={qrUrl} alt={t("Payment QR code", "رمز QR للدفع")} width={600} height={600} sizes="(max-width: 768px) 90vw, 300px" className="h-full w-full object-contain" />
                      ) : (
                        <QrCode size={32} strokeWidth={1.5} aria-hidden="true" className="text-[#c3cbc5]" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">1</div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-extrabold text-[#142019]">
                          {withoutQr
                            ? t("Transfer to our Sham Cash number", "حوّل إلى رقم شام كاش الخاص بنا")
                            : t("Scan the QR code", "امسح رمز QR")}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#647168]">
                          {withoutQr
                            ? t("Open your Sham Cash app and send the transfer to this number.", "افتح تطبيق شام كاش وأرسل التحويل إلى هذا الرقم.")
                            : t("Open your Sham Cash app and scan the code to complete the transfer.", "افتح تطبيق شام كاش وامسح الرمز لإتمام عملية التحويل.")}
                        </p>
                        {withoutQr && (
                          paymentNumberBox || (
                            <p className="mt-4 rounded-[1.25rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4 text-sm font-bold leading-6 text-[#647168]">
                              {t("The payment number is currently unavailable. Please choose cash on delivery or contact us.", "رقم الدفع غير متوفر حالياً. يرجى اختيار الدفع عند الاستلام أو التواصل معنا.")}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                    <div className="mt-6 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">2</div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#142019]">{t("Transfer the order total", "حوّل المبلغ الإجمالي")}</h3>
                        <p className="mt-1 text-2xl font-extrabold text-[#0a583b]">{totalText}</p>
                      </div>
                    </div>
                    {!withoutQr && paymentNumberBox}
                  </div>
                </div>

                {/* Transaction ID input */}
                <div className="p-4 lg:border-t lg:border-[#e7ebe8] lg:p-7">
                  <div className="flex items-start gap-3">
                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b] lg:flex">3</div>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#142019]"><label htmlFor="shamcash-transaction">{t("Enter your transaction number", "أدخل رقم العملية")}</label></h2>
                      <p className="mt-1 hidden text-sm leading-6 text-[#647168] lg:block">{t("After transferring, enter the transaction number from your Sham Cash app. Your order will be confirmed instantly.", "بعد التحويل، أدخل رقم العملية من تطبيق شام كاش. سيتم تأكيد طلبك فوراً.")}</p>
                    </div>
                  </div>

                  <form id="payment-proof-form" onSubmit={handleSubmit} className="mt-3 lg:mt-5">
                    <div className={`flex items-center overflow-hidden rounded-2xl border transition ${transactionError ? "border-red-300 bg-red-50/60" : "border-[#dfe4e0] bg-white focus-within:border-[#0a583b] focus-within:ring-4 focus-within:ring-[#edf5f0]"}`}>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-[#dfe4e0] bg-[#f7f8f6]">
                        <Hash size={18} className="text-[#0a583b]" />
                      </div>
                      <input
                        type="text"
                        id="shamcash-transaction"
                        inputMode="numeric"
                        dir="ltr"
                        aria-invalid={Boolean(transactionError)}
                        aria-describedby={transactionError ? "transaction-error" : undefined}
                        value={transactionId}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => { setTransactionId(e.target.value.replace(/\D/g, "")); setTransactionError(""); }}
                        placeholder={t("e.g. 123456789", "مثال: 123456789")}
                        maxLength={15}
                        disabled={loading}
                        className="min-w-0 flex-1 bg-transparent py-4 pe-4 text-base font-bold text-[#142019] outline-none placeholder:text-[#a2aaa4] disabled:opacity-50"
                      />
                    </div>
                    {transactionError && <p id="transaction-error" role="alert" className="mt-2 text-xs font-bold leading-5 text-red-600">{transactionError}</p>}

                    <div className="mt-4 hidden items-start gap-3 rounded-2xl bg-[#f7f8f6] px-4 py-3 lg:flex">
                      <LockKeyhole size={16} className="mt-0.5 shrink-0 text-[#0a583b]" />
                      <p className="text-xs leading-5 text-[#647168]">
                        {t("Your transaction is verified automatically and securely via Sham Cash.", "يتم التحقق من عمليتك تلقائياً وبشكل آمن عبر شام كاش.")}
                      </p>
                    </div>

                    {/* Desktop submit */}
                    <button type="submit" disabled={loading || !totalReady || !transactionId.trim()} className="mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex">
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
              <div className="p-4 lg:p-7">
                <div className="rounded-[1.5rem] border border-[#b8d7c4] bg-[#edf5f0] p-4 lg:p-6">
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
                <form id="payment-proof-form" onSubmit={handleSubmit} className="mt-3 lg:mt-5">
                  <button type="submit" disabled={loading || !totalReady} className="hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex">
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


        </div>
      </div>

      {/* Mobile submit */}
      <div dir={isArabic ? "rtl" : "ltr"} className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe4e0] bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(20,32,25,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="min-w-0 shrink-0">
            <p className="text-[10px] font-bold text-[#7a857e]">{t("Total", "الإجمالي")}</p>
            <p className="mt-0.5 whitespace-nowrap text-sm font-extrabold text-[#142019]">{totalText}</p>
          </div>
          <button
            type="submit"
            form="payment-proof-form"
            disabled={loading || !totalReady || Boolean(unavailableItem) || (paymentMethod === "sham_cash" && !transactionId.trim())}
            className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#b4bdb7]"
          >
            {loading ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span className="truncate">{t("Submitting...", "جاري الإرسال...")}</span></>
            ) : (
              <><ShieldCheck size={16} /><span className="truncate">{paymentMethod === "cod" ? t("Confirm order", "تأكيد الطلب") : t("Verify & confirm", "تحقق وأكّد")}</span></>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
