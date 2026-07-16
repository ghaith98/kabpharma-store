"use client";

import Link from "next/link";

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
  FileText,
  LockKeyhole,
  Package,
  QrCode,
  ShieldCheck,
  Truck,
  UploadCloud,
  X,
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

type BanCheckResult = {
  is_banned?: boolean;
  reason?: string | null;
};

export default function PaymentPage() {
  const { lang } =
    useLanguage();

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
    const savedUser =
      localStorage.getItem(
        "kab_user"
      );

    if (!savedUser) {
      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href =
        "/profile?account_required=1";

      return;
    }

    const savedCheckout =
      localStorage.getItem(
        "checkout"
      );

    if (!savedCheckout) {
      window.location.href =
        "/checkout";

      return;
    }

    try {
      const parsedCheckout =
        JSON.parse(
          savedCheckout
        ) as CheckoutData;

      setCheckout(
        parsedCheckout
      );

      setCart(
        getCart() as CartItemWithVariant[]
      );

      setPageReady(true);
    } catch (error) {
      console.error(
        "Failed to read checkout information:",
        error
      );

      localStorage.removeItem(
        "checkout"
      );

      window.location.href =
        "/checkout";

      return;
    }

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

    void loadPaymentSettings();
  }, []);

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

  function getFileSizeLabel(
    size: number
  ) {
    if (
      size < 1024 * 1024
    ) {
      return `${Math.max(
        1,
        Math.round(
          size / 1024
        )
      )} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
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

    const savedUser =
      localStorage.getItem(
        "kab_user"
      );

    if (!savedUser) {
      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href =
        "/profile?account_required=1";

      return;
    }

    let currentUser: StoredUser;

    try {
      currentUser =
        JSON.parse(
          savedUser
        ) as StoredUser;
    } catch {
      localStorage.removeItem(
        "kab_user"
      );

      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href =
        "/login";

      return;
    }

    const accountPhone =
      String(
        currentUser.phone ||
          ""
      ).trim();

    if (!accountPhone) {
      localStorage.removeItem(
        "kab_user"
      );

      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href =
        "/login";

      return;
    }

    const {
      data: banData,
      error: banError,
    } = await supabase.rpc(
      "check_user_ban",
      {
        p_phone:
          accountPhone,
      }
    );

    if (banError) {
      console.error(
        "Failed to check account restriction:",
        banError
      );

      alert(
        isArabic
          ? "تعذر التحقق من حالة الحساب. يرجى المحاولة مرة أخرى."
          : "Could not verify your account status. Please try again."
      );

      return;
    }

    const banResult:
      | BanCheckResult
      | null =
      Array.isArray(banData)
        ? (banData[0] as
            | BanCheckResult
            | undefined) ||
          null
        : (banData as BanCheckResult | null);

    if (
      banResult?.is_banned
    ) {
      alert(
        isArabic
          ? "لا يمكن إرسال طلبات جديدة من هذا الحساب حالياً. يرجى التواصل معنا للمساعدة."
          : "This account cannot place new orders at the moment. Please contact us for assistance."
      );

      window.location.href =
        "/checkout";

      return;
    }

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

      window.location.href =
        "/checkout";

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

      window.location.href =
        "/checkout";

      return;
    }

    const currentCart =
      getCart() as CartItemWithVariant[];

    const currentDeliveryFee =
      Number(
        currentCheckout.delivery_fee ||
          0
      );

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

      window.location.href =
        "/checkout";

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

      window.location.href =
        "/products";

      return;
    }

    setLoading(true);

    let createdOrderId:
      | number
      | null = null;

    let uploadedProofPath:
      | string
      | null = null;

    try {
      const currentProductsTotal =
        currentCart.reduce(
          (sum, item) =>
            sum +
            Number(
              item.price || 0
            ) *
              Number(
                item.quantity ||
                  0
              ),
          0
        );

      const orderTotal =
        currentProductsTotal +
        currentDeliveryFee;

      const originalExtension =
        file.name
          .split(".")
          .pop()
          ?.trim()
          .toLowerCase() ||
        "";

      const safeBaseName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .trim()
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          )
          .replace(
            /^-|-$/g,
            ""
          )
          .slice(0, 80);

      const safeFileName =
        originalExtension
          ? `${
              safeBaseName ||
              "payment-proof"
            }.${originalExtension}`
          : safeBaseName ||
            "payment-proof";

      const uniqueFileId =
        typeof crypto !==
          "undefined" &&
        typeof crypto.randomUUID ===
          "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const filePath =
        `orders/${Date.now()}-` +
        `${uniqueFileId}-${safeFileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          "payment-proofs"
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            contentType:
              file.type ||
              (originalExtension ===
              "pdf"
                ? "application/pdf"
                : undefined),

            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          isArabic
            ? `تعذر رفع إثبات الدفع: ${uploadError.message}`
            : `Could not upload payment proof: ${uploadError.message}`
        );
      }

      uploadedProofPath =
        filePath;

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(
          "payment-proofs"
        )
        .getPublicUrl(
          filePath
        );

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          customer_name:
            currentCheckout.name.trim(),

          phone:
            accountPhone,

          governorate:
            currentCheckout.governorate,

          delivery_area:
            currentCheckout.delivery_area,

          address:
            currentCheckout.address.trim(),

          delivery_fee:
            currentDeliveryFee,

          total_price:
            orderTotal,

          status:
            "pending",

          payment_proof_url:
            publicUrlData.publicUrl,

          payment_proof_path:
            filePath,

          payment_proof_reviewed_at:
            null,

          delivered_at:
            null,

          payment_proof_deleted_at:
            null,
        })
        .select()
        .single();

      if (
        orderError ||
        !order
      ) {
        throw new Error(
          isArabic
            ? `تعذر إنشاء الطلب: ${
                orderError?.message ||
                "Unknown error"
              }`
            : `Could not create the order: ${
                orderError?.message ||
                "Unknown error"
              }`
        );
      }

      createdOrderId =
        Number(order.id);

      const orderItems =
        currentCart.map(
          (item) => ({
            order_id:
              order.id,

            product_id:
              item.id,

            product_name:
              item.product_name ||
              item.name,

            variant_id:
              item.variant_id ||
              null,

            variant_label_ar:
              item.variant_label_ar ||
              null,

            variant_label_en:
              item.variant_label_en ||
              null,

            image_url:
              item.image_url ||
              null,

            quantity:
              Number(
                item.quantity
              ),

            unit_price:
              Number(
                item.price
              ),
          })
        );

      const {
        error: itemsError,
      } = await supabase
        .from(
          "order_items"
        )
        .insert(
          orderItems
        );

      if (itemsError) {
        throw new Error(
          isArabic
            ? `تعذر حفظ منتجات الطلب: ${itemsError.message}`
            : `Could not save order items: ${itemsError.message}`
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

      window.location.href =
        `/orders/${order.id}`;
    } catch (
      error: unknown
    ) {
      if (
        createdOrderId !==
        null
      ) {
        const {
          error:
            deleteOrderError,
        } = await supabase
          .from("orders")
          .delete()
          .eq(
            "id",
            createdOrderId
          );

        if (
          deleteOrderError
        ) {
          console.error(
            "Failed to delete incomplete order:",
            deleteOrderError
          );
        }
      }

      if (
        uploadedProofPath
      ) {
        const {
          error:
            deleteProofError,
        } = await supabase.storage
          .from(
            "payment-proofs"
          )
          .remove([
            uploadedProofPath,
          ]);

        if (
          deleteProofError
        ) {
          console.error(
            "Failed to delete incomplete payment proof:",
            deleteProofError
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
                  ? "text-4xl leading-tight [font-family:Tahoma,Arial,sans-serif] sm:text-5xl"
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
                  <img
                    src={qrUrl}
                    alt={
                      isArabic
                        ? "رمز QR للدفع"
                        : "Payment QR code"
                    }
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
            <div className="border-t border-[#e7ebe8] p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                  <UploadCloud
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-[#142019]">
                    {isArabic
                      ? "ارفع إثبات الدفع"
                      : "Upload payment proof"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#647168]">
                    {isArabic
                      ? "يمكنك رفع صورة الإيصال أو ملف PDF بحجم أقصى 20 MB."
                      : "Upload a receipt image or PDF with a maximum size of 20 MB."}
                  </p>
                </div>
              </div>

              <form
                id="payment-proof-form"
                onSubmit={
                  handleSubmit
                }
                className="mt-6"
              >
                {!file ? (
                  <label
                    className={`group flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-5 text-center transition ${
                      fileError
                        ? "border-red-300 bg-red-50/50"
                        : "border-[#cbd3cd] bg-[#fafbf9] hover:border-[#0a583b] hover:bg-[#f3f8f5]"
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                        fileError
                          ? "bg-red-100 text-red-600"
                          : "bg-white text-[#0a583b] shadow-sm ring-1 ring-[#e7ebe8] group-hover:scale-105"
                      }`}
                    >
                      <UploadCloud
                        size={23}
                      />
                    </div>

                    <p className="mt-5 text-sm font-extrabold text-[#142019]">
                      {isArabic
                        ? "اضغط لاختيار إثبات الدفع"
                        : "Choose your payment proof"}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#7a857e]">
                      JPG, PNG, WEBP,
                      HEIC or PDF · Max
                      20 MB
                    </p>

                    <span className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-[#cbd3cd] bg-white px-5 text-xs font-extrabold text-[#142019] transition group-hover:border-[#0a583b] group-hover:text-[#0a583b]">
                      {isArabic
                        ? "اختيار ملف"
                        : "Select file"}
                    </span>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      accept="image/*,application/pdf,.pdf"
                      onChange={
                        handleFileChange
                      }
                      disabled={
                        loading
                      }
                      required
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div
                    className={`rounded-[1.5rem] border p-5 ${
                      fileError
                        ? "border-red-300 bg-red-50"
                        : "border-[#b8d7c4] bg-[#f1f8f4]"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                          fileError
                            ? "bg-red-100 text-red-600"
                            : "bg-white text-[#0a583b] shadow-sm"
                        }`}
                      >
                        {fileError ? (
                          <FileText
                            size={20}
                          />
                        ) : (
                          <FileCheck2
                            size={20}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          dir="ltr"
                          title={
                            file.name
                          }
                          className={`truncate text-start text-sm font-extrabold ${
                            fileError
                              ? "text-red-700"
                              : "text-[#142019]"
                          }`}
                        >
                          {getShortFileName(
                            file.name
                          )}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#7a857e]">
                          {getFileSizeLabel(
                            file.size
                          )}
                        </p>

                        {!fileError && (
                          <p className="mt-2 text-xs font-bold text-[#0a583b]">
                            {isArabic
                              ? "الملف جاهز للإرسال"
                              : "Ready to submit"}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          loading
                        }
                        onClick={
                          removeSelectedFile
                        }
                        aria-label={
                          isArabic
                            ? "إزالة الملف"
                            : "Remove file"
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#7a857e] shadow-sm transition hover:text-red-600 disabled:opacity-50"
                      >
                        <X
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div
                    role="alert"
                    className="mt-3 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                  >
                    {fileError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !file ||
                    Boolean(
                      fileError
                    )
                  }
                  className="mt-6 hidden min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-[#b4bdb7] disabled:hover:translate-y-0 disabled:hover:shadow-none lg:flex"
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
                      <ShieldCheck
                        size={17}
                      />

                      <span>
                        {isArabic
                          ? "تأكيد الدفع وإرسال الطلب"
                          : "Confirm payment and submit order"}
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-start gap-3 rounded-[1.25rem] bg-[#f7f8f6] p-4">
                <LockKeyhole
                  size={17}
                  className="mt-0.5 shrink-0 text-[#0a583b]"
                />

                <p className="text-xs leading-6 text-[#647168]">
                  {isArabic
                    ? "سيتم إرسال الطلب للمراجعة بعد رفع إثبات الدفع، ويمكنك متابعة حالته من حسابك."
                    : "Your order will be submitted for review after the payment proof is uploaded. You can track its status from your account."}
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
                      itemsCount ===
                      1
                        ? "item"
                        : "items"
                    }`}
              </span>
            </div>

            {/* Items */}
            <div className="mt-6 max-h-[340px] space-y-4 overflow-y-auto border-b border-[#e7ebe8] pb-5 pe-1">
              {cart.length ===
              0 ? (
                <p className="text-sm text-[#647168]">
                  {isArabic
                    ? "السلة فارغة"
                    : "Your cart is empty"}
                </p>
              ) : (
                cart.map(
                  (item) => {
                    const itemKey =
                      getCartItemKey(
                        item
                      );

                    const variantLabel =
                      getVariantLabel(
                        item
                      );

                    const displayName =
                      getDisplayName(
                        item
                      );

                    return (
                      <div
                        key={
                          itemKey
                        }
                        className="flex min-w-0 gap-3"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[#f7f8f6] p-2">
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url
                              }
                              alt={
                                displayName
                              }
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
                              {
                                displayName
                              }
                            </p>

                            <p className="shrink-0 text-sm font-extrabold text-[#142019]">
                              {formatPrice(
                                Number(
                                  item.price
                                ) *
                                  Number(
                                    item.quantity
                                  )
                              )}
                            </p>
                          </div>

                          {variantLabel && (
                            <p className="mt-1 text-xs font-bold text-[#0a583b]">
                              {isArabic
                                ? "الخيار: "
                                : "Option: "}

                              {
                                variantLabel
                              }
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
                  }
                )
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
                  {formatPrice(
                    productsTotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-[#526057]">
                <span>
                  {isArabic
                    ? "التوصيل"
                    : "Delivery"}
                </span>

                <span className="font-bold text-[#142019]">
                  {deliveryFee >
                  0
                    ? formatPrice(
                        deliveryFee
                      )
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
                {formatPrice(
                  total
                )}
              </span>
            </div>

            {/* Delivery */}
            {deliveryLocation && (
              <div className="mt-6 flex items-start gap-3 rounded-[1.25rem] bg-[#f7f8f6] p-4">
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
                    {
                      deliveryLocation
                    }
                  </p>

                  {checkout.address && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7a857e]">
                      {
                        checkout.address
                      }
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
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
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
              {formatPrice(
                total
              )}
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
                <ShieldCheck
                  size={16}
                />

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