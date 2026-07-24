"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FileCheck2,
  LockKeyhole,
  Package,
  QrCode,
  ShieldCheck,
  Truck,
  UploadCloud,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
  CartItem,
  getCart,
  saveCart,
} from "@/lib/cart";

import { useLanguage } from "../../context/LanguageContext";

const MAX_PAYMENT_PROOF_SIZE =
  20 * 1024 * 1024;

type CartItemWithVariant =
  CartItem & {
    cart_key?: string;
    product_name?: string;

    variant_id?:
      | number
      | null;

    variant_label_ar?:
      | string
      | null;

    variant_label_en?:
      | string
      | null;
  };

type CheckoutData = {
  name?: string;
  phone?: string;
  governorate?: string;
  delivery_area?: string;
  address?: string;

  delivery_fee?:
    | number
    | string;
};

type StoredUser = {
  full_name?: string;
  phone?: string;
};

export default function PaymentPage() {
  const { lang } =
    useLanguage();
  const router = useRouter();

  const isArabic =
    lang === "ar";

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    file,
    setFile,
  ] = useState<File | null>(
    null
  );

  const [
    fileError,
    setFileError,
  ] = useState("");

  const [
    cart,
    setCart,
  ] = useState<
    CartItemWithVariant[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    pageReady,
    setPageReady,
  ] = useState(false);

  const [
    qrUrl,
    setQrUrl,
  ] = useState("");

  const [
    paymentNumber,
    setPaymentNumber,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);

  const [
    checkout,
    setCheckout,
  ] = useState<CheckoutData>(
    {}
  );

  const BackArrow =
    isArabic
      ? ArrowRight
      : ArrowLeft;

  useEffect(() => {
    let cancelled = false;

    async function loadPaymentSettings() {
      const [
        qrResult,
        numberResult,
      ] = await Promise.all([
        supabase
          .from("settings")
          .select("value")
          .eq(
            "key",
            "payment_qr_url"
          )
          .maybeSingle(),

        supabase
          .from("settings")
          .select("value")
          .eq(
            "key",
            "payment_number"
          )
          .maybeSingle(),
      ]);

      if (
        qrResult.error
      ) {
        console.error(
          "Failed to load payment QR:",
          qrResult.error
        );
      } else if (
        qrResult.data?.value
      ) {
        setQrUrl(
          qrResult.data.value
        );
      }

      if (
        numberResult.error
      ) {
        console.error(
          "Failed to load payment number:",
          numberResult.error
        );
      } else if (
        numberResult.data
          ?.value
      ) {
        setPaymentNumber(
          numberResult.data
            .value
        );
      }
    }

    async function initializePayment() {
      try {
        const response = await fetch(
          "/api/customer/me",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("kab_user");
          localStorage.setItem(
            "redirect_after_login",
            "/payment"
          );
          router.replace(
            "/profile?account_required=1"
          );
          return;
        }

        if (!response.ok) {
          throw new Error("Account check failed");
        }

        const result = (await response.json()) as {
          user?: StoredUser;
        };

        localStorage.setItem(
          "kab_user",
          JSON.stringify(result.user || {})
        );

        const savedCheckout =
          localStorage.getItem("checkout");

        if (!savedCheckout) {
          router.replace("/checkout");
          return;
        }

        const parsedCheckout = JSON.parse(
          savedCheckout
        ) as CheckoutData;

        if (cancelled) return;

        setCheckout(parsedCheckout);
        setCart(
          getCart() as CartItemWithVariant[]
        );
        setPageReady(true);

        await loadPaymentSettings();
      } catch (error) {
        console.error(
          "Failed to initialize payment:",
          error
        );
        localStorage.removeItem("checkout");
        router.replace("/checkout");
      }
    }

    const initializationTimer = window.setTimeout(
      () => void initializePayment(),
      0
    );

    return () => {
      cancelled = true;
      window.clearTimeout(initializationTimer);
    };
  }, [router]);

  function formatPrice(
    value: number
  ) {
    return `${Math.round(
      Number(value || 0)
    ).toLocaleString()} SYP`;
  }

  function getCartItemKey(
    item: CartItemWithVariant
  ) {
    return (
      item.cart_key ||
      `${item.id}-${
        item.variant_id ||
        "base"
      }`
    );
  }

  function getVariantLabel(
    item: CartItemWithVariant
  ) {
    return isArabic
      ? item.variant_label_ar ||
          item.variant_label_en
      : item.variant_label_en ||
          item.variant_label_ar;
  }

  function getDisplayName(
    item: CartItemWithVariant
  ) {
    const variantLabel =
      getVariantLabel(item);

    if (item.product_name) {
      return item.product_name;
    }

    if (
      variantLabel &&
      item.name.includes(
        " - "
      )
    ) {
      return item.name.split(
        " - "
      )[0];
    }

    return item.name;
  }

  function getShortFileName(
    fileName: string,
    maxLength = 44
  ) {
    if (
      fileName.length <=
      maxLength
    ) {
      return fileName;
    }

    const lastDotIndex =
      fileName.lastIndexOf(
        "."
      );

    const hasExtension =
      lastDotIndex > 0;

    const extension =
      hasExtension
        ? fileName.slice(
            lastDotIndex
          )
        : "";

    const baseName =
      hasExtension
        ? fileName.slice(
            0,
            lastDotIndex
          )
        : fileName;

    const availableBaseLength =
      Math.max(
        12,
        maxLength -
          extension.length -
          3
      );

    return `${baseName.slice(
      0,
      availableBaseLength
    )}...${extension}`;
  }

  function isImageOrPdf(
    selectedFile: File
  ) {
    const mimeType =
      selectedFile.type
        .trim()
        .toLowerCase();

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.trim()
        .toLowerCase() ||
      "";

    if (
      mimeType ===
        "application/pdf" ||
      extension === "pdf"
    ) {
      return true;
    }

    if (
      mimeType.startsWith(
        "image/"
      )
    ) {
      return true;
    }

    const imageExtensions =
      [
        "jpg",
        "jpeg",
        "jfif",
        "png",
        "webp",
        "heic",
        "heif",
        "avif",
        "gif",
        "bmp",
        "tif",
        "tiff",
      ];

    return imageExtensions.includes(
      extension
    );
  }

  function getPaymentProofError(
    selectedFile: File
  ) {
    if (
      !isImageOrPdf(
        selectedFile
      )
    ) {
      return isArabic
        ? "يرجى اختيار صورة أو ملف PDF."
        : "Please choose an image or PDF file.";
    }

    if (
      selectedFile.size ===
      0
    ) {
      return isArabic
        ? "الملف المختار فارغ. يرجى اختيار ملف آخر."
        : "The selected file is empty. Please choose another file.";
    }

    if (
      selectedFile.size >
      MAX_PAYMENT_PROOF_SIZE
    ) {
      return isArabic
        ? "حجم الملف أكبر من 20 MB. يرجى اختيار ملف أصغر."
        : "The file is larger than 20 MB. Please choose a smaller file.";
    }

    return "";
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      setFileError("");
      return;
    }

    const validationError =
      getPaymentProofError(
        selectedFile
      );

    setFile(selectedFile);

    setFileError(
      validationError
    );
  }

  function removeSelectedFile() {
    setFile(null);
    setFileError("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  async function copyPaymentNumber() {
    try {
      await navigator.clipboard.writeText(
        paymentNumber
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1600
      );
    } catch {
      alert(
        isArabic
          ? "تعذر نسخ رقم الدفع."
          : "Could not copy the payment number."
      );
    }
  }

  const deliveryFee =
    Number(
      checkout.delivery_fee ||
        0
    );

  const productsTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.price || 0
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );

  const total =
    productsTotal +
    deliveryFee;

  const itemsCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  const deliveryLocation =
    [
      checkout.delivery_area,
      checkout.governorate,
    ]
      .filter(Boolean)
      .join("، ");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!file) {
      setFileError(
        isArabic
          ? "يرجى رفع إثبات الدفع."
          : "Please upload payment proof."
      );

      return;
    }

    const validationError =
      getPaymentProofError(
        file
      );

    if (validationError) {
      setFileError(
        validationError
      );

      return;
    }

    setFileError("");

    const savedCheckout =
      localStorage.getItem(
        "checkout"
      );

    if (!savedCheckout) {
      alert(
        isArabic
          ? "معلومات الطلب غير موجودة. يرجى إدخالها من جديد."
          : "Checkout information is missing. Please enter it again."
      );

      router.replace("/checkout");

      return;
    }

    let currentCheckout: CheckoutData;

    try {
      currentCheckout =
        JSON.parse(
          savedCheckout
        ) as CheckoutData;
    } catch {
      localStorage.removeItem(
        "checkout"
      );

      alert(
        isArabic
          ? "تعذر قراءة معلومات الطلب. يرجى إدخالها من جديد."
          : "Checkout information could not be read. Please enter it again."
      );

      router.replace("/checkout");

      return;
    }

    const currentCart =
      getCart() as CartItemWithVariant[];

    if (
      !currentCheckout.name ||
      !currentCheckout.governorate ||
      !currentCheckout.delivery_area ||
      !currentCheckout.address
    ) {
      alert(
        isArabic
          ? "معلومات الطلب غير مكتملة."
          : "Checkout information is incomplete."
      );

      router.replace("/checkout");

      return;
    }

    if (
      currentCart.length ===
      0
    ) {
      alert(
        isArabic
          ? "السلة فارغة."
          : "Your cart is empty."
      );

      router.replace("/products");

      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.set(
        "checkout",
        JSON.stringify({
          name: currentCheckout.name,
          governorate:
            currentCheckout.governorate,
          delivery_area:
            currentCheckout.delivery_area,
          address: currentCheckout.address,
        })
      );
      formData.set(
        "cart",
        JSON.stringify(
          currentCart.map((item) => ({
            id: item.id,
            variant_id:
              item.variant_id ?? null,
            quantity: item.quantity,
          }))
        )
      );
      formData.set("proof", file);

      const response = await fetch(
        "/api/customer/orders",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          localStorage.setItem(
            "redirect_after_login",
            "/payment"
          );
          router.replace("/login");
          return;
        }

        throw new Error(
          isArabic
            ? "تعذر إنشاء الطلب. تم تحديث الأسعار والتوفر؛ يرجى مراجعة السلة والمحاولة مجدداً."
            : "The order could not be created. Prices or availability may have changed; review your cart and try again."
        );
      }

      saveCart([]);

      window.dispatchEvent(
        new Event(
          "cartUpdated"
        )
      );

      localStorage.removeItem(
        "checkout"
      );

      router.replace(
        `/orders/${result.orderId}`
      );
    } catch (
      error: unknown
    ) {
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

  if (!pageReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#dfe4e0] border-t-[#0a583b]" />

          <p className="mt-4 text-sm font-bold text-[#647168]">
            {isArabic
              ? "جاري تحميل معلومات الدفع..."
              : "Loading payment details..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen overflow-x-hidden bg-[#f7f8f6] px-4 py-8 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:pb-16"
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Progress */}
        <nav
          aria-label={
            isArabic
              ? "مراحل إتمام الطلب"
              : "Checkout progress"
          }
          className="max-w-[470px]"
        >
          <div
            dir="ltr"
            className="flex items-center"
          >
            <Link
              href="/checkout"
              aria-label={
                isArabic
                  ? "العودة إلى معلومات التوصيل"
                  : "Return to delivery information"
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a583b] text-white transition hover:bg-[#073f2c]"
            >
              <Check
                size={16}
                strokeWidth={2.4}
              />
            </Link>

            <div className="h-px flex-1 bg-[#0a583b]" />

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a583b] text-xs font-extrabold text-white">
              2
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-5 text-xs font-extrabold">
            <Link
              href="/checkout"
              className="text-[#647168] transition hover:text-[#0a583b]"
            >
              {isArabic
                ? "معلومات التوصيل"
                : "Delivery"}
            </Link>

            <span className="text-[#0a583b]">
              {isArabic
                ? "الدفع"
                : "Payment"}
            </span>
          </div>
        </nav>

        {/* Header */}
        <header className="mt-9 flex flex-col gap-6 border-b border-[#dfe4e0] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.18em]"
              }`}
            >
              KAB Pharma
            </p>

            <h1
              className={`mt-3 font-extrabold text-[#142019] ${
                isArabic
                  ? "text-4xl leading-tight [font-family:var(--font-arabic)] sm:text-5xl"
                  : "text-4xl tracking-[-0.045em] sm:text-6xl"
              }`}
            >
              {isArabic
                ? "إتمام الدفع"
                : "Complete payment"}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
              {isArabic
                ? "حوّل قيمة الطلب، ثم ارفع صورة واضحة أو ملف PDF لإثبات الدفع."
                : "Transfer your order total, then upload a clear image or PDF of your payment receipt."}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#cbd3cd] bg-white px-4 py-2.5 text-xs font-bold text-[#526057]">
            <LockKeyhole
              size={15}
              className="text-[#0a583b]"
            />

            <span>
              {isArabic
                ? "تأكيد طلب آمن"
                : "Secure order confirmation"}
            </span>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          {/* Payment */}
          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
            <div className="border-b border-[#e7ebe8] p-5 sm:p-7">
              <p
                className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                  isArabic
                    ? "tracking-normal"
                    : "tracking-[0.15em]"
                }`}
              >
                {isArabic
                  ? "طريقة الدفع"
                  : "Payment method"}
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#142019]">
                {isArabic
                  ? "الدفع عبر رمز QR"
                  : "Pay using the QR code"}
              </h2>
            </div>

            {/* QR area */}
            <div className="grid gap-7 p-5 sm:p-7 md:grid-cols-[270px_minmax(0,1fr)] md:items-center">
              <div className="flex aspect-square w-full max-w-[300px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4">
                {qrUrl ? (
                  <Image
                    src={qrUrl}
                    alt={
                      isArabic
                        ? "رمز QR للدفع"
                        : "Payment QR code"
                    }
                    width={600}
                    height={600}
                    sizes="(max-width: 768px) 90vw, 300px"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="px-5 text-center">
                    <QrCode
                      size={32}
                      strokeWidth={1.5}
                      className="mx-auto text-[#8a948d]"
                    />

                    <p className="mt-4 text-sm font-bold text-[#647168]">
                      {isArabic
                        ? "رمز الدفع غير متوفر حالياً."
                        : "Payment QR code is currently unavailable."}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">
                    1
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#142019]">
                      {isArabic
                        ? "امسح رمز QR"
                        : "Scan the QR code"}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#647168]">
                      {isArabic
                        ? "افتح تطبيق الدفع وامسح الرمز لإتمام عملية التحويل."
                        : "Open your payment application and scan the code to complete the transfer."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs font-extrabold text-[#0a583b]">
                    2
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#142019]">
                      {isArabic
                        ? "حوّل المبلغ الإجمالي"
                        : "Transfer the order total"}
                    </h3>

                    <p className="mt-1 text-2xl font-extrabold text-[#0a583b]">
                      {formatPrice(
                        total
                      )}
                    </p>
                  </div>
                </div>

                {paymentNumber && (
                  <div className="mt-6 rounded-[1.25rem] border border-[#dfe4e0] bg-[#f7f8f6] p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a857e]">
                      {isArabic
                        ? "رقم الدفع"
                        : "Payment number"}
                    </p>

                    <div
                      dir="ltr"
                      className="mt-2 flex min-w-0 items-center gap-3"
                    >
                      <span className="min-w-0 flex-1 break-all font-mono text-sm font-extrabold text-[#142019]">
                        {
                          paymentNumber
                        }
                      </span>

                      <button
                        type="button"
                        onClick={
                          copyPaymentNumber
                        }
                        aria-label={
                          isArabic
                            ? "نسخ رقم الدفع"
                            : "Copy payment number"
                        }
                        className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold transition ${
                          copied
                            ? "bg-[#0a583b] text-white"
                            : "border border-[#cbd3cd] bg-white text-[#142019] hover:border-[#0a583b] hover:text-[#0a583b]"
                        }`}
                      >
                        {copied ? (
                          <Check
                            size={14}
                          />
                        ) : (
                          <Copy
                            size={14}
                          />
                        )}

                        <span>
                          {copied
                            ? isArabic
                              ? "تم النسخ"
                              : "Copied"
                            : isArabic
                            ? "نسخ"
                            : "Copy"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Upload */}
<div className="border-t border-[#e7ebe8] p-4 sm:p-7">
  <h2 className="text-lg font-extrabold text-[#142019]">
    {isArabic
      ? "ارفع إثبات الدفع"
      : "Upload payment proof"}
  </h2>

  <form
    id="payment-proof-form"
    onSubmit={handleSubmit}
    className="mt-4"
  >
    <label
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
        fileError
          ? "border-red-300 bg-red-50/60"
          : file
            ? "border-[#b8d7c4] bg-[#edf5f0]"
            : "border-[#dfe4e0] bg-white hover:border-[#8fb5a0] hover:bg-[#f7f8f6]"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          fileError
            ? "bg-red-100 text-red-600"
            : file
              ? "bg-white text-[#0a583b]"
              : "bg-[#edf5f0] text-[#0a583b]"
        }`}
      >
        {file && !fileError ? (
          <FileCheck2 size={19} />
        ) : (
          <UploadCloud size={19} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-[#142019]">
          {file
            ? isArabic
              ? "تم اختيار إثبات الدفع"
              : "Payment proof selected"
            : isArabic
              ? "اختر إثبات الدفع"
              : "Choose payment proof"}
        </span>

        <span
          dir={file ? "ltr" : undefined}
          title={file?.name || ""}
          className={`mt-1 block truncate text-xs ${
            fileError
              ? "font-bold text-red-600"
              : "text-[#7a857e]"
          }`}
        >
          {file
            ? getShortFileName(file.name)
            : isArabic
              ? "اضغط لاختيار الملف"
              : "Tap to choose a file"}
        </span>
      </span>

      <span className="shrink-0 text-xs font-extrabold text-[#0a583b]">
        {file
          ? isArabic
            ? "تغيير"
            : "Change"
          : isArabic
            ? "اختيار"
            : "Choose"}
      </span>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf"
        onChange={handleFileChange}
        disabled={loading}
        required
        className="hidden"
      />
    </label>

    {fileError && (
      <p
        role="alert"
        className="mt-2 text-xs font-bold leading-5 text-red-600"
      >
        {fileError}
      </p>
    )}

    {file && (
      <button
        type="button"
        disabled={loading}
        onClick={removeSelectedFile}
        className="mt-2 text-xs font-bold text-[#7a857e] transition hover:text-red-600 disabled:opacity-50"
      >
        {isArabic
          ? "إزالة الملف"
          : "Remove file"}
      </button>
    )}

    {/* Desktop submit */}
    <button
      type="submit"
      disabled={
        loading ||
        !file ||
        Boolean(fileError)
      }
      className="mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

          <span>
            {isArabic
              ? "جاري إرسال الطلب..."
              : "Submitting order..."}
          </span>
        </>
      ) : (
        <>
          <ShieldCheck size={17} />

          <span>
            {isArabic
              ? "تأكيد الدفع وإرسال الطلب"
              : "Confirm payment and submit order"}
          </span>
        </>
      )}
    </button>
  </form>

  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f7f8f6] px-4 py-3">
    <LockKeyhole
      size={16}
      className="mt-0.5 shrink-0 text-[#0a583b]"
    />

    <p className="text-xs leading-5 text-[#647168]">
      {isArabic
        ? "سيتم إرسال الطلب للمراجعة، ويمكنك متابعة حالته من حسابك."
        : "Your order will be submitted for review and can be tracked from your account."}
    </p>
  </div>
</div>
</section>

{/* Summary */}
<aside className="h-fit min-w-0 rounded-[1.75rem] border border-[#dfe4e0] bg-white p-5 sm:p-6 lg:sticky lg:top-6">
  <p
    className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
      isArabic
        ? "tracking-normal"
        : "tracking-[0.15em]"
    }`}
  >
    {isArabic
      ? "ملخص الطلب"
      : "Order summary"}
  </p>

  <div className="mt-3 flex items-end justify-between gap-4">
    <h2 className="text-2xl font-extrabold tracking-tight text-[#142019]">
      {isArabic
        ? "طلبك"
        : "Your order"}
    </h2>

    <span className="text-xs font-bold text-[#7a857e]">
      {isArabic
        ? `${itemsCount} قطعة`
        : `${itemsCount} ${
            itemsCount === 1
              ? "item"
              : "items"
          }`}
    </span>
  </div>

  {/* Items */}
  <div className="mt-6 max-h-[340px] space-y-4 overflow-y-auto border-b border-[#e7ebe8] pb-5 pe-1">
    {cart.length === 0 ? (
      <p className="text-sm text-[#647168]">
        {isArabic
          ? "السلة فارغة"
          : "Your cart is empty"}
      </p>
    ) : (
      cart.map((item) => {
        const itemKey =
          getCartItemKey(item);

        const variantLabel =
          getVariantLabel(item);

        const displayName =
          getDisplayName(item);

        return (
          <div
            key={itemKey}
            className="flex min-w-0 gap-3"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f8f6] p-2">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={displayName}
                  width={128}
                  height={128}
                  sizes="64px"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Package
                  size={20}
                  className="text-[#a2aaa4]"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="line-clamp-2 text-sm font-extrabold leading-5 text-[#142019]">
                  {displayName}
                </p>

                <p className="shrink-0 text-sm font-extrabold text-[#142019]">
                  {formatPrice(
                    Number(item.price) *
                      Number(item.quantity)
                  )}
                </p>
              </div>

              {variantLabel && (
                <p className="mt-1 text-xs font-bold text-[#0a583b]">
                  {isArabic
                    ? "الخيار: "
                    : "Option: "}

                  {variantLabel}
                </p>
              )}

              <p className="mt-1 text-xs text-[#7a857e]">
                {isArabic
                  ? `الكمية: ${item.quantity}`
                  : `Qty: ${item.quantity}`}
              </p>
            </div>
          </div>
        );
      })
    )}
  </div>

  {/* Totals */}
  <div className="mt-5 space-y-3.5 text-sm">
    <div className="flex items-center justify-between gap-4 text-[#526057]">
      <span>
        {isArabic
          ? "المنتجات"
          : "Products"}
      </span>

      <span className="font-bold text-[#142019]">
        {formatPrice(productsTotal)}
      </span>
    </div>

    <div className="flex items-center justify-between gap-4 text-[#526057]">
      <span>
        {isArabic
          ? "التوصيل"
          : "Delivery"}
      </span>

      <span className="font-bold text-[#142019]">
        {deliveryFee > 0
          ? formatPrice(deliveryFee)
          : isArabic
            ? "مجاني"
            : "Free"}
      </span>
    </div>
  </div>

  <div className="my-5 h-px bg-[#dfe4e0]" />

  <div className="flex items-end justify-between gap-4">
    <span className="font-extrabold text-[#142019]">
      {isArabic
        ? "الإجمالي"
        : "Total"}
    </span>

    <span className="text-xl font-extrabold text-[#0a583b]">
      {formatPrice(total)}
    </span>
  </div>

  {/* Delivery */}
  {deliveryLocation && (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f8f6] p-4">
      <Truck
        size={18}
        className="mt-0.5 shrink-0 text-[#0a583b]"
      />

      <div className="min-w-0">
        <p className="text-xs font-extrabold text-[#142019]">
          {isArabic
            ? "التوصيل إلى"
            : "Delivering to"}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#647168]">
          {deliveryLocation}
        </p>

        {checkout.address && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a857e]">
            {checkout.address}
          </p>
        )}
      </div>
    </div>
  )}

  <Link
    href="/checkout"
    className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#526057] transition hover:text-[#0a583b]"
  >
    <BackArrow
      size={14}
      className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
    />

    <span>
      {isArabic
        ? "تعديل معلومات الطلب"
        : "Edit delivery information"}
    </span>
  </Link>
</aside>
</div>
</div>

{/* Mobile submit */}
<div
  dir={isArabic ? "rtl" : "ltr"}
  className="fixed inset-x-0 bottom-16 z-50 border-t border-[#dfe4e0] bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(20,32,25,0.08)] backdrop-blur-xl lg:hidden"
>
  <div className="mx-auto flex max-w-3xl items-center gap-4">
    <div className="min-w-0 shrink-0">
      <p className="text-[10px] font-bold text-[#7a857e]">
        {isArabic
          ? "الإجمالي"
          : "Total"}
      </p>

      <p className="mt-0.5 whitespace-nowrap text-sm font-extrabold text-[#142019]">
        {formatPrice(total)}
      </p>
    </div>

    <button
      type="submit"
      form="payment-proof-form"
      disabled={
        loading ||
        !file ||
        Boolean(fileError)
      }
      className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#b4bdb7]"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

          <span className="truncate">
            {isArabic
              ? "جاري الإرسال..."
              : "Submitting..."}
          </span>
        </>
      ) : (
        <>
          <ShieldCheck size={16} />

          <span className="truncate">
            {isArabic
              ? "تأكيد الدفع"
              : "Confirm payment"}
          </span>
        </>
      )}
    </button>
  </div>
</div>
</main>
);
}

