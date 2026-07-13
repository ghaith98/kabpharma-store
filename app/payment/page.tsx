"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

const MAX_PAYMENT_PROOF_SIZE = 20 * 1024 * 1024;

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

type BanCheckResult = {
  is_banned?: boolean;
  reason?: string | null;
};

export default function PaymentPage() {
  const { lang } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
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
      const parsedCheckout = JSON.parse(
        savedCheckout
      ) as CheckoutData;

      setCheckout(parsedCheckout);
      setCart(getCart() as CartItemWithVariant[]);
    } catch (error) {
      console.error(
        "Failed to read checkout information:",
        error
      );

      localStorage.removeItem("checkout");
      window.location.href = "/checkout";
      return;
    }

    async function loadPaymentSettings() {
      const { data: qrData, error: qrError } =
        await supabase
          .from("settings")
          .select("value")
          .eq("key", "payment_qr_url")
          .single();

      if (!qrError && qrData?.value) {
        setQrUrl(qrData.value);
      }

      const {
        data: numberData,
        error: numberError,
      } = await supabase
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
    return (
      item.cart_key ||
      `${item.id}-${item.variant_id || "base"}`
    );
  }

  function getVariantLabel(item: CartItemWithVariant) {
    return isArabic
      ? item.variant_label_ar ||
          item.variant_label_en
      : item.variant_label_en ||
          item.variant_label_ar;
  }

  function getDisplayName(item: CartItemWithVariant) {
    const variantLabel = getVariantLabel(item);

    if (item.product_name) {
      return item.product_name;
    }

    if (
      variantLabel &&
      item.name.includes(" - ")
    ) {
      return item.name.split(" - ")[0];
    }

    return item.name;
  }

  function getShortFileName(
    fileName: string,
    maxLength = 38
  ) {
    if (fileName.length <= maxLength) {
      return fileName;
    }

    const lastDotIndex = fileName.lastIndexOf(".");
    const hasExtension = lastDotIndex > 0;

    const extension = hasExtension
      ? fileName.slice(lastDotIndex)
      : "";

    const baseName = hasExtension
      ? fileName.slice(0, lastDotIndex)
      : fileName;

    const availableBaseLength = Math.max(
      12,
      maxLength - extension.length - 3
    );

    return `${baseName.slice(
      0,
      availableBaseLength
    )}...${extension}`;
  }

  function isImageOrPdf(selectedFile: File) {
    const mimeType = selectedFile.type
      .trim()
      .toLowerCase();

    const extension =
      selectedFile.name
        .split(".")
        .pop()
        ?.trim()
        .toLowerCase() || "";

    if (
      mimeType === "application/pdf" ||
      extension === "pdf"
    ) {
      return true;
    }

    if (mimeType.startsWith("image/")) {
      return true;
    }

    const imageExtensions = [
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

    return imageExtensions.includes(extension);
  }

  function getPaymentProofError(
    selectedFile: File
  ) {
    if (!isImageOrPdf(selectedFile)) {
      return isArabic
        ? "يرجى اختيار صورة أو ملف PDF."
        : "Please choose an image or PDF file.";
    }

    if (selectedFile.size === 0) {
      return isArabic
        ? "الملف المختار فارغ. يرجى اختيار ملف آخر."
        : "The selected file is empty. Please choose another file.";
    }

    if (
      selectedFile.size >
      MAX_PAYMENT_PROOF_SIZE
    ) {
      return isArabic
        ? "حجم الصورة أو الملف كبير جداً. يرجى اختيار ملف أصغر."
        : "The image or file is too large. Please choose a smaller file.";
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
      getPaymentProofError(selectedFile);

    setFile(selectedFile);
    setFileError(validationError);
  }

  function removeSelectedFile() {
    setFile(null);
    setFileError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const deliveryFee = Number(
    checkout.delivery_fee || 0
  );

  const productsTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        Number(item.quantity),
    0
  );

  const total = productsTotal + deliveryFee;

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
      getPaymentProofError(file);

    if (validationError) {
      setFileError(validationError);
      return;
    }

    setFileError("");

    /*
      نقرأ رقم الهاتف من الحساب الحالي، وليس من
      checkout، حتى لا يمكن تجاوز الحظر بتغيير
      localStorage.
    */
    const savedUser =
      localStorage.getItem("kab_user");

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
      currentUser = JSON.parse(
        savedUser
      ) as StoredUser;
    } catch {
      localStorage.removeItem("kab_user");

      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href = "/login";
      return;
    }

    const accountPhone = String(
      currentUser.phone || ""
    ).trim();

    if (!accountPhone) {
      localStorage.removeItem("kab_user");

      localStorage.setItem(
        "redirect_after_login",
        "/payment"
      );

      window.location.href = "/login";
      return;
    }

    /*
      فحص الحظر قبل رفع الملف، حتى لا يبقى
      Payment Proof يتيم داخل Storage.
    */
    const {
      data: banData,
      error: banError,
    } = await supabase.rpc("check_user_ban", {
      p_phone: accountPhone,
    });

    if (banError) {
      console.error(
        "Failed to check account restriction:",
        {
          message: banError.message,
          details: banError.details,
          hint: banError.hint,
          code: banError.code,
        }
      );

      alert(
        isArabic
          ? "تعذر التحقق من حالة الحساب. يرجى المحاولة مرة أخرى."
          : "Could not verify your account status. Please try again."
      );

      return;
    }

    const banResult: BanCheckResult | null =
      Array.isArray(banData)
        ? (banData[0] as
            | BanCheckResult
            | undefined) || null
        : (banData as BanCheckResult | null);

    if (banResult?.is_banned) {
      alert(
        isArabic
          ? "لا يمكن إرسال طلبات جديدة من هذا الحساب حالياً. يرجى التواصل معنا للمساعدة."
          : "This account cannot place new orders at the moment. Please contact us for assistance."
      );

      window.location.href = "/checkout";
      return;
    }

    const savedCheckout =
      localStorage.getItem("checkout");

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
      currentCheckout = JSON.parse(
        savedCheckout
      ) as CheckoutData;
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

    const currentCart =
      getCart() as CartItemWithVariant[];

    const currentDeliveryFee = Number(
      currentCheckout.delivery_fee || 0
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

      window.location.href = "/checkout";
      return;
    }

    if (currentCart.length === 0) {
      alert(
        isArabic
          ? "السلة فارغة."
          : "Your cart is empty."
      );

      window.location.href = "/products";
      return;
    }

    setLoading(true);

    let createdOrderId: number | null = null;

    try {
      const currentProductsTotal =
        currentCart.reduce(
          (sum, item) =>
            sum +
            Number(item.price) *
              Number(item.quantity),
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
          .toLowerCase() || "";

      const safeBaseName = file.name
        .replace(/\.[^/.]+$/, "")
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);

      const safeFileName = originalExtension
        ? `${
            safeBaseName || "payment-proof"
          }.${originalExtension}`
        : safeBaseName || "payment-proof";

      const uniqueFileId =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
          "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      const filePath =
        `orders/${Date.now()}-` +
        `${uniqueFileId}-${safeFileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("payment-proofs")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType:
              file.type ||
              (originalExtension === "pdf"
                ? "application/pdf"
                : undefined),
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          isArabic
            ? `تعذر رفع إثبات الدفع: ${uploadError.message}`
            : `Could not upload payment proof: ${uploadError.message}`
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("payment-proofs")
          .getPublicUrl(filePath);

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          customer_name:
            currentCheckout.name.trim(),

          phone: accountPhone,

          governorate:
            currentCheckout.governorate,

          delivery_area:
            currentCheckout.delivery_area,

          address:
            currentCheckout.address.trim(),

          delivery_fee:
            currentDeliveryFee,

          total_price: orderTotal,

          status: "pending",

          payment_proof_url:
            publicUrlData.publicUrl,

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
                orderError?.message ||
                "Unknown error"
              }`
            : `Could not create the order: ${
                orderError?.message ||
                "Unknown error"
              }`
        );
      }

      createdOrderId = Number(order.id);

      const orderItems = currentCart.map(
        (item) => ({
          order_id: order.id,
          product_id: item.id,

          product_name:
            item.product_name || item.name,

          variant_id:
            item.variant_id || null,

          variant_label_ar:
            item.variant_label_ar || null,

          variant_label_en:
            item.variant_label_en || null,

          image_url:
            item.image_url || null,

          quantity:
            Number(item.quantity),

          unit_price:
            Number(item.price),
        })
      );

      const { error: itemsError } =
        await supabase
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

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      localStorage.removeItem("checkout");

      window.location.href =
        `/orders/${order.id}`;
    } catch (error: unknown) {
      if (createdOrderId !== null) {
        const { error: deleteOrderError } =
          await supabase
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
          <div
            className="flex items-center"
            dir="ltr"
          >
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
            <a
              href="/checkout"
              className="text-green-700"
            >
              {isArabic
                ? "معلومات الطلب"
                : "Checkout"}
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
          <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {isArabic
                ? "تعليمات الدفع"
                : "Payment Instructions"}
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
                    {isArabic
                      ? "رقم الدفع"
                      : "Payment Number"}
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
            </div>

            {/* Upload form */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 min-w-0 space-y-4"
            >
              <label className="block w-full min-w-0 max-w-full cursor-pointer overflow-hidden">
                <div
                  className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white transition ${
                    fileError
                      ? "border-red-500 ring-2 ring-red-100"
                      : file
                      ? "border-green-300 ring-1 ring-green-100"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex w-full min-w-0 items-center overflow-hidden">
                    <span
                      className={`shrink-0 whitespace-nowrap px-3 py-4 text-sm font-semibold text-white transition sm:px-4 sm:text-base ${
                        fileError
                          ? "bg-red-600"
                          : "bg-green-600"
                      }`}
                    >
                      {isArabic
                        ? "اختر ملف"
                        : "Choose File"}
                    </span>

                    <span
                      dir={
                        file
                          ? "ltr"
                          : isArabic
                          ? "rtl"
                          : "ltr"
                      }
                      title={file?.name || ""}
                      className={`block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-3 text-start text-sm sm:px-4 sm:text-base ${
                        fileError
                          ? "font-semibold text-red-700"
                          : "text-gray-600"
                      }`}
                    >
                      {file
                        ? getShortFileName(
                            file.name
                          )
                        : isArabic
                        ? "لم يتم اختيار ملف"
                        : "No file chosen"}
                    </span>
                  </div>

                  {file && !fileError && (
                    <div className="w-full min-w-0 overflow-hidden border-t border-green-100 bg-green-50 px-4 py-2 text-xs font-semibold text-green-800">
                      <p className="truncate">
                        {isArabic
                          ? "تم اختيار الملف بنجاح"
                          : "File selected successfully"}
                      </p>
                    </div>
                  )}
                </div>

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
                <div
                  role="alert"
                  className="w-full max-w-full break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                >
                  {fileError}
                </div>
              )}

              {file && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={removeSelectedFile}
                  className="text-sm font-bold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                >
                  {isArabic
                    ? "إزالة الملف المختار"
                    : "Remove selected file"}
                </button>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !file ||
                  Boolean(fileError)
                }
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
          <aside className="h-fit min-w-0 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              {isArabic
                ? "ملخص الطلب"
                : "Order Summary"}
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
                  const itemKey =
                    getCartItemKey(item);

                  const variantLabel =
                    getVariantLabel(item);

                  const displayName =
                    getDisplayName(item);

                  return (
                    <div
                      key={itemKey}
                      className="flex min-w-0 justify-between gap-4 text-sm"
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
                              {isArabic
                                ? "الخيار: "
                                : "Option: "}
                              {variantLabel}
                            </p>
                          )}

                          <p className="mt-1 text-gray-700">
                            {isArabic
                              ? "الكمية"
                              : "Qty"}
                            : {item.quantity}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {Number(
                              item.price
                            ).toLocaleString()}{" "}
                            SYP
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
                <span>
                  {isArabic
                    ? "المنتجات"
                    : "Products"}
                </span>

                <span>
                  {productsTotal.toLocaleString()}{" "}
                  SYP
                </span>
              </div>

              <div className="flex justify-between font-bold text-gray-800">
                <span>
                  {isArabic
                    ? "التوصيل"
                    : "Delivery"}
                </span>

                <span>
                  {deliveryFee.toLocaleString()}{" "}
                  SYP
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-4 text-lg font-extrabold text-gray-900">
              <span>
                {isArabic
                  ? "الإجمالي"
                  : "Total"}
              </span>

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