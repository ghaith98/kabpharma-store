"use client";

import {
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  LockKeyhole,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  CartItem,
  getCart,
} from "@/lib/cart";

import { useLanguage } from "../../context/LanguageContext";

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

type StoredUser = {
  full_name?: string;
  phone?: string;
};

type BanCheckResult = {
  is_banned?: boolean;
  reason?: string | null;
};

type Governorate = {
  id: number | string;
  governorate: string;
  governorate_ar?: string | null;
  governorate_en?: string | null;
};

type DeliveryArea = {
  id: number | string;
  governorate: string;
  area_name: string;
  area_name_ar?: string | null;
  area_name_en?: string | null;
  delivery_fee?: number | string | null;
};

type StoredCheckout = {
  name?: string;
  governorate?: string;
  delivery_area?: string;
  address?: string;
};

export default function CheckoutPage() {
  const { lang } =
    useLanguage();
  const router = useRouter();

  const isArabic =
    lang === "ar";

  const BackArrow =
    isArabic
      ? ArrowRight
      : ArrowLeft;

  const [cart, setCart] =
    useState<
      CartItemWithVariant[]
    >([]);

  const [
    governorates,
    setGovernorates,
  ] = useState<Governorate[]>([]);

  const [
    deliveryAreas,
    setDeliveryAreas,
  ] = useState<DeliveryArea[]>([]);

  const [
    freeShippingThreshold,
    setFreeShippingThreshold,
  ] = useState(0);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    governorate,
    setGovernorate,
  ] = useState("");

  const [
    deliveryArea,
    setDeliveryArea,
  ] = useState("");

  const [address, setAddress] =
    useState("");

  // Saved addresses
  const [
    savedAddresses,
    setSavedAddresses,
  ] = useState<
    Array<{
      label: string;
      governorate: string;
      delivery_area: string;
      address: string;
    }>
  >([]);

  const [
    savedAddrOpen,
    setSavedAddrOpen,
  ] = useState(false);

  const [
    checkingBan,
    setCheckingBan,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    isBanned,
    setIsBanned,
  ] = useState(false);

  const [
    accountCheckError,
    setAccountCheckError,
  ] = useState("");

  const checkBanOnInitialization =
    useEffectEvent(
      (accountPhone: string) =>
        checkCurrentUserBan(
          accountPhone
        )
    );

  useEffect(() => {
    let cancelled = false;

    async function initializeCheckout() {
      setCart(
        getCart() as CartItemWithVariant[]
      );

      void loadDeliveryData();

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
            "/checkout"
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
        const user = result.user;
        const accountPhone = String(
          user?.phone || ""
        ).trim();

        if (!accountPhone || cancelled) return;

        localStorage.setItem(
          "kab_user",
          JSON.stringify(user)
        );

        setPhone(accountPhone);

        // Load saved addresses
        try {
          const addrRes = await fetch("/api/customer/addresses", {
            credentials: "include",
            cache: "no-store",
          });
          if (addrRes.ok) {
            const addrData = (await addrRes.json()) as { addresses?: Array<{ label: string; governorate: string; delivery_area: string; address: string }> };
            if (!cancelled && Array.isArray(addrData.addresses) && addrData.addresses.length > 0) {
              setSavedAddresses(addrData.addresses);
            }
          }
        } catch { /* non-critical */ }

        const savedCheckout =
          localStorage.getItem("checkout");

        if (savedCheckout) {
          try {
            const checkout = JSON.parse(
              savedCheckout
            ) as StoredCheckout;
            setName(
              checkout.name || user?.full_name || ""
            );
            setGovernorate(
              checkout.governorate || ""
            );
            setAddress(checkout.address || "");
          } catch {
            localStorage.removeItem("checkout");
            setName(user?.full_name || "");
          }
        } else {
          setName(user?.full_name || "");
        }

        await checkBanOnInitialization(accountPhone);
      } catch {
        if (!cancelled) {
          setAccountCheckError(
            isArabic
              ? "تعذر التحقق من حسابك. يرجى المحاولة مرة أخرى."
              : "Could not verify your account. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setCheckingBan(false);
        }
      }
    }

    const initializationTimer = window.setTimeout(
      () => void initializeCheckout(),
      0
    );

    return () => {
      cancelled = true;
      window.clearTimeout(initializationTimer);
    };
  }, [isArabic, router]);

  useEffect(() => {
    const savedCheckout =
      localStorage.getItem(
        "checkout"
      );

    if (
      !savedCheckout ||
      deliveryAreas.length === 0
    ) {
      return;
    }

    try {
      const checkout =
        JSON.parse(savedCheckout) as StoredCheckout;

      const matchedArea =
        deliveryAreas.find(
          (area) =>
            area.area_name ===
              checkout.delivery_area &&
            area.governorate ===
              checkout.governorate
        );

      if (matchedArea) {
        window.queueMicrotask(() => {
          setDeliveryArea(
            String(matchedArea.id)
          );
        });
      }
    } catch {
      localStorage.removeItem(
        "checkout"
      );
    }
  }, [deliveryAreas]);

  async function checkCurrentUserBan(
    accountPhone: string
  ) {
    setAccountCheckError("");

    const normalizedPhone =
      String(
        accountPhone || ""
      ).trim();

    if (!normalizedPhone) {
      setAccountCheckError(
        isArabic
          ? "تعذر التحقق من حسابك. يرجى تسجيل الدخول مرة أخرى."
          : "Could not verify your account. Please sign in again."
      );

      return {
        banned: false,
        error: true,
      };
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "check_user_ban",
      {
        p_phone:
          normalizedPhone,
      }
    );

    if (error) {
      console.error(
        "Failed to check user restriction:",
        {
          message:
            error.message,

          details:
            error.details,

          hint:
            error.hint,

          code:
            error.code,
        }
      );

      setAccountCheckError(
        isArabic
          ? "تعذر التحقق من حالة الحساب. يرجى المحاولة مرة أخرى."
          : "Could not verify your account status. Please try again."
      );

      return {
        banned: false,
        error: true,
      };
    }

    const result:
      | BanCheckResult
      | null = Array.isArray(
      data
    )
      ? (data[0] as
          | BanCheckResult
          | undefined) ||
        null
      : (data as
          | BanCheckResult
          | null);

    const banned =
      Boolean(
        result?.is_banned
      );

    setIsBanned(banned);

    return {
      banned,
      error: false,
    };
  }

  async function loadDeliveryData() {
    const {
      data: govData,
      error: govError,
    } = await supabase
      .from("delivery_fees")
      .select("*")
      .eq("is_active", true)
      .order("id", {
        ascending: true,
      });

    if (govError) {
      console.error(
        "Failed to load governorates:",
        govError
      );

      return;
    }

    const {
      data: areaData,
      error: areaError,
    } = await supabase
      .from("delivery_areas")
      .select("*")
      .eq("is_active", true)
      .order("area_name", {
        ascending: true,
      });

    if (areaError) {
      console.error(
        "Failed to load delivery areas:",
        areaError
      );

      return;
    }

    const {
      data: settingData,
    } = await supabase
      .from("settings")
      .select("value")
      .eq(
        "key",
        "free_shipping_threshold"
      )
      .single();

    setGovernorates(
      govData || []
    );

    setDeliveryAreas(
      areaData || []
    );

    setFreeShippingThreshold(
      Number(
        settingData?.value ||
          0
      )
    );
  }

  function getCartItemKey(
    item: CartItemWithVariant
  ) {
    return (
      item.cart_key ||
      `${item.id}-${
        item.variant_id ??
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

  function formatPrice(
    value: number
  ) {
    return `${Math.round(
      value
    ).toLocaleString()} SYP`;
  }

  const productsTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          Number(
            item.quantity
          ),
      0
    );

  const itemsCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity
        ),
      0
    );

  const areasForGovernorate =
    deliveryAreas.filter(
      (area) =>
        area.governorate ===
        governorate
    );

  const selectedArea =
    deliveryAreas.find(
      (area) =>
        String(area.id) ===
        deliveryArea
    );

  const rawDeliveryFee =
    Number(
      selectedArea?.delivery_fee ||
        0
    );

  const hasFreeShipping =
    freeShippingThreshold >
      0 &&
    productsTotal >=
      freeShippingThreshold;

  const deliveryFee =
    hasFreeShipping
      ? 0
      : rawDeliveryFee;

  const total =
    productsTotal +
    deliveryFee;

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      checkingBan ||
      submitting
    ) {
      return;
    }

    if (cart.length === 0) {
      alert(
        isArabic
          ? "السلة فارغة"
          : "Your cart is empty"
      );

      return;
    }

    const normalizedName =
      name
        .replace(/\s+/g, " ")
        .trim();

    const normalizedAddress =
      address
        .replace(/\s+/g, " ")
        .trim();

    if (
      normalizedName.length <
      2
    ) {
      alert(
        isArabic
          ? "يرجى إدخال اسم كامل وصحيح"
          : "Please enter a valid full name"
      );

      return;
    }

    if (!governorate) {
      alert(
        isArabic
          ? "يرجى اختيار المحافظة"
          : "Please select a governorate"
      );

      return;
    }

    if (
      !deliveryArea ||
      !selectedArea ||
      selectedArea.governorate !==
        governorate
    ) {
      alert(
        isArabic
          ? "يرجى اختيار منطقة التوصيل"
          : "Please select a delivery area"
      );

      return;
    }

    if (
      normalizedAddress.length <
      5
    ) {
      alert(
        isArabic
          ? "يرجى إدخال عنوان توصيل أكثر تفصيلاً"
          : "Please enter a more detailed delivery address"
      );

      return;
    }

    const accountPhone =
      String(phone || "").trim();

    if (!accountPhone) {
      localStorage.setItem(
        "redirect_after_login",
        "/checkout"
      );

      router.replace("/login");

      return;
    }

    setSubmitting(true);

    try {
      const banStatus =
        await checkCurrentUserBan(
          accountPhone
        );

      if (banStatus.error) {
        alert(
          isArabic
            ? "تعذر التحقق من حالة الحساب. يرجى المحاولة مرة أخرى."
            : "Could not verify your account status. Please try again."
        );

        return;
      }

      if (banStatus.banned) {
        setIsBanned(true);

        alert(
          isArabic
            ? "لا يمكن إتمام طلبات جديدة من هذا الحساب حالياً. يرجى التواصل معنا للمساعدة."
            : "This account cannot place new orders at the moment. Please contact us for assistance."
        );

        return;
      }

      localStorage.setItem(
        "checkout",
        JSON.stringify({
          name:
            normalizedName,

          phone:
            accountPhone,

          governorate,

          delivery_area:
            selectedArea.area_name,

          delivery_area_ar:
            selectedArea.area_name_ar ||
            "",

          delivery_area_en:
            selectedArea.area_name_en ||
            "",

          address:
            normalizedAddress,

          delivery_fee:
            deliveryFee,
        })
      );

      router.push("/payment");
    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      alert(
        isArabic
          ? "تعذر متابعة الطلب. يرجى المحاولة مرة أخرى."
          : "Could not continue your order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled =
    checkingBan ||
    submitting ||
    isBanned ||
    Boolean(
      accountCheckError
    ) ||
    cart.length === 0;

  function getSubmitText() {
    if (submitting) {
      return isArabic
        ? "جاري المتابعة..."
        : "Continuing...";
    }

    if (checkingBan) {
      return isArabic
        ? "جاري التحقق..."
        : "Checking account...";
    }

    if (isBanned) {
      return isArabic
        ? "إتمام الطلب غير متاح"
        : "Checkout unavailable";
    }

    if (accountCheckError) {
      return isArabic
        ? "تعذر التحقق من الحساب"
        : "Account check failed";
    }

    return isArabic
      ? "المتابعة إلى الدفع"
      : "Continue to payment";
  }

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-[#f7f8f6] px-4 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-7 sm:px-6 sm:pt-10 lg:pb-16 lg:pt-12"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Mobile progress */}
        <div className="mx-auto mb-8 max-w-md lg:hidden">
          <div
            dir="ltr"
            className="flex items-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a583b] text-xs font-extrabold text-white">
              1
            </div>

            <div className="h-px flex-1 bg-[#d5ddd7]" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d5ddd7] bg-white text-xs font-extrabold text-[#8a948d]">
              2
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-bold">
            <span className="text-[#0a583b]">
              {isArabic
                ? "معلومات التوصيل"
                : "Delivery"}
            </span>

            <span className="text-[#8a948d]">
              {isArabic
                ? "الدفع"
                : "Payment"}
            </span>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8 border-b border-[#dfe4e0] pb-8 sm:mb-10 sm:pb-10">
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[0.18em]"
            }`}
          >
            KAB Pharma
          </p>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                className={`text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-[48px] ${
                  isArabic
                    ? "leading-[1.25] tracking-normal [font-family:var(--font-arabic)]"
                    : "leading-[1.05] tracking-[-0.04em]"
                }`}
              >
                {isArabic
                  ? "معلومات التوصيل"
                  : "Delivery details"}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
                {isArabic
                  ? "أدخل تفاصيل التوصيل، ثم انتقل إلى الدفع لإكمال طلبك."
                  : "Add your delivery information, then continue to payment to complete your order."}
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-4 py-2 text-xs font-bold text-[#526057]">
              <LockKeyhole
                size={14}
                className="text-[#0a583b]"
              />

              {isArabic
                ? "طلب آمن"
                : "Secure checkout"}
            </div>
          </div>
        </header>

        {/* Restricted account */}
        {isBanned && (
          <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                <CircleAlert
                  size={19}
                />
              </div>

              <div>
                <h2 className="font-extrabold text-red-800">
                  {isArabic
                    ? "إتمام الطلبات غير متاح حالياً"
                    : "Checkout is currently unavailable"}
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-red-700">
                  {isArabic
                    ? "لا يمكن إرسال طلب جديد من هذا الحساب حالياً. يرجى التواصل معنا للمساعدة."
                    : "This account cannot place a new order at the moment. Please contact us for assistance."}
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-red-700 px-5 text-sm font-extrabold text-white transition hover:bg-red-800"
            >
              {isArabic
                ? "تواصل معنا"
                : "Contact us"}
            </Link>
          </section>
        )}

        {/* Verification error */}
        {accountCheckError &&
          !isBanned && (
            <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CircleAlert
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <p className="text-sm font-bold leading-6 text-amber-800">
                  {accountCheckError}
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setCheckingBan(
                    true
                  );
                  try {
                    await checkCurrentUserBan(
                      phone
                    );
                  } finally {
                    setCheckingBan(
                      false
                    );
                  }
                }}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-amber-300 bg-white px-4 text-xs font-extrabold text-amber-800 transition hover:bg-amber-100"
              >
                <RotateCcw
                  size={14}
                />

                {isArabic
                  ? "إعادة المحاولة"
                  : "Try again"}
              </button>
            </section>
          )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          {/* Delivery form */}
          <form
            id="checkout-form"
            onSubmit={
              handleSubmit
            }
            className="overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white"
          >
            <div className="flex items-start gap-4 border-b border-[#e7ebe8] p-5 sm:p-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <Truck
                  size={20}
                />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#142019]">
                  {isArabic
                    ? "عنوان التوصيل"
                    : "Delivery address"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#647168]">
                  {isArabic
                    ? "تأكد من إدخال معلومات واضحة لضمان وصول الطلب بسهولة."
                    : "Add clear details so your order can be delivered without delays."}
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              {/* Saved addresses dropdown */}
              {savedAddresses.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-[#dfe4e0]">
                  <button
                    type="button"
                    onClick={() =>
                      setSavedAddrOpen(
                        (o) => !o
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 bg-[#f3f7f4] px-4 py-3 text-left transition hover:bg-[#edf5f0]"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin
                        size={14}
                        className="shrink-0 text-[#0a583b]"
                      />

                      <span className="text-sm font-extrabold text-[#142019]">
                        {isArabic
                          ? "استخدام عنوان محفوظ"
                          : "Use a saved address"}
                      </span>
                    </div>

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`shrink-0 text-[#647168] transition-transform duration-200 ${
                        savedAddrOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {savedAddrOpen && (
                    <div className="divide-y divide-[#edf0ed]">
                      {savedAddresses.map(
                        (addr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setGovernorate(
                                addr.governorate
                              );
                              setDeliveryArea(
                                ""
                              );
                              setAddress(
                                addr.address
                              );
                              setSavedAddrOpen(
                                false
                              );
                            }}
                            className="flex w-full flex-col items-start gap-0.5 px-4 py-3.5 text-left transition hover:bg-[#f7fbf8]"
                          >
                            <span className="text-sm font-extrabold text-[#0a583b]">
                              {addr.label}
                            </span>

                            <span className="text-xs text-[#526057]">
                              {addr.governorate}
                              {addr.delivery_area
                                ? `, ${addr.delivery_area}`
                                : ""}
                            </span>

                            <span className="text-xs text-[#526057]">
                              {addr.address}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Full name */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
                  <UserRound
                    size={15}
                    className="text-[#0a583b]"
                  />

                  {isArabic
                    ? "الاسم الكامل"
                    : "Full name"}
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "أدخل الاسم الكامل"
                      : "Enter your full name"
                  }
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base text-[#142019] outline-none transition placeholder:text-[#9aa39d] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                />
              </label>

              {/* Phone */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
                  <Phone
                    size={15}
                    className="text-[#0a583b]"
                  />

                  {isArabic
                    ? "رقم الهاتف"
                    : "Phone number"}
                </span>

                <input
                  type="tel"
                  value={phone}
                  readOnly
                  dir="ltr"
                  className="w-full cursor-not-allowed rounded-xl border border-[#e7ebe8] bg-[#f7f8f6] px-4 py-3.5 text-start text-base font-semibold text-[#526057] outline-none"
                />

                <p className="mt-2 text-xs leading-5 text-[#7a857e]">
                  {isArabic
                    ? "رقم الهاتف مرتبط بحسابك ولا يمكن تغييره هنا."
                    : "This phone number is linked to your account and cannot be changed here."}
                </p>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Governorate */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
                    <MapPin
                      size={15}
                      className="text-[#0a583b]"
                    />

                    {isArabic
                      ? "المحافظة"
                      : "Governorate"}
                  </span>

                  <select
                    value={
                      governorate
                    }
                    onChange={(
                      event
                    ) => {
                      setGovernorate(
                        event.target
                          .value
                      );

                      setDeliveryArea(
                        ""
                      );
                    }}
                    required
                    className="w-full rounded-xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base text-[#142019] outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                  >
                    <option value="">
                      {isArabic
                        ? "اختر المحافظة"
                        : "Select governorate"}
                    </option>

                    {governorates.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.governorate
                          }
                        >
                          {isArabic
                            ? item.governorate_ar ||
                              item.governorate
                            : item.governorate_en ||
                              item.governorate}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {/* Delivery area */}
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
                    <Truck
                      size={15}
                      className="text-[#0a583b]"
                    />

                    {isArabic
                      ? "منطقة التوصيل"
                      : "Delivery area"}
                  </span>

                  <select
                    value={
                      deliveryArea
                    }
                    onChange={(
                      event
                    ) =>
                      setDeliveryArea(
                        event.target
                          .value
                      )
                    }
                    required
                    disabled={
                      !governorate
                    }
                    className="w-full rounded-xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base text-[#142019] outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0] disabled:cursor-not-allowed disabled:bg-[#f7f8f6] disabled:text-[#9aa39d]"
                  >
                    <option value="">
                      {governorate
                        ? isArabic
                          ? "اختر المنطقة"
                          : "Select area"
                        : isArabic
                        ? "اختر المحافظة أولاً"
                        : "Select governorate first"}
                    </option>

                    {areasForGovernorate.map(
                      (area) => (
                        <option
                          key={
                            area.id
                          }
                          value={
                            area.id
                          }
                        >
                          {isArabic
                            ? area.area_name_ar ||
                              area.area_name
                            : area.area_name_en ||
                              area.area_name}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              {selectedArea && (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f8f6] px-4 py-3 text-xs">
                  <span className="font-bold text-[#647168]">
                    {isArabic
                      ? "رسوم التوصيل"
                      : "Delivery fee"}
                  </span>

                  <span className="font-extrabold text-[#0a583b]">
                    {hasFreeShipping
                      ? isArabic
                        ? "مجاني"
                        : "Free"
                      : formatPrice(
                          rawDeliveryFee
                        )}
                  </span>
                </div>
              )}

              {/* Address */}
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#142019]">
                  <MapPin
                    size={15}
                    className="text-[#0a583b]"
                  />

                  {isArabic
                    ? "العنوان التفصيلي"
                    : "Detailed address"}
                </span>

                <textarea
                  value={address}
                  onChange={(
                    event
                  ) =>
                    setAddress(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "الحي، الشارع، البناء، الطابق وأقرب نقطة دالة..."
                      : "Neighbourhood, street, building, floor and nearest landmark..."
                  }
                  autoComplete="street-address"
                  required
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-xl border border-[#dfe4e0] bg-white px-4 py-3.5 text-base leading-7 text-[#142019] outline-none transition placeholder:text-[#9aa39d] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                />

                <p className="mt-1.5 text-end text-xs text-[#9aa39d]">
                  {address.length}/500
                </p>
              </label>

              {/* Desktop submit */}
              <button
                type="submit"
                disabled={
                  submitDisabled
                }
                className="hidden min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#b4bdb7] lg:flex"
              >
                {submitting ||
                checkingBan ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <ShieldCheck
                    size={17}
                  />
                )}

                {getSubmitText()}
              </button>

              <div className="hidden items-center justify-center gap-2 text-xs text-[#7a857e] lg:flex">
                <LockKeyhole
                  size={13}
                  className="text-[#0a583b]"
                />

                {isArabic
                  ? "سيتم تأكيد تفاصيل الدفع في الخطوة التالية."
                  : "Payment details will be confirmed in the next step."}
              </div>
            </div>
          </form>

          {/* Order summary */}
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

            {hasFreeShipping && (
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#edf5f0] px-4 py-3">
                <Truck
                  size={16}
                  className="shrink-0 text-[#0a583b]"
                />

                <p className="text-xs font-extrabold text-[#0a583b]">
                  {isArabic
                    ? "تم تفعيل التوصيل المجاني لطلبك."
                    : "Free delivery has been applied to your order."}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="mt-6 max-h-[340px] space-y-4 overflow-y-auto border-b border-[#e7ebe8] pb-5 pe-1">
              {cart.length === 0 ? (
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
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f7f8f6] p-2">
                          {item.image_url ? (
                            <Image
                              src={
                                item.image_url
                              }
                              alt={
                                displayName
                              }
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
                  {!selectedArea &&
                  !hasFreeShipping
                    ? "—"
                    : hasFreeShipping
                    ? isArabic
                      ? "مجاني"
                      : "Free"
                    : formatPrice(
                        deliveryFee
                      )}
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

            <Link
              href="/cart"
              className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#526057] transition hover:text-[#0a583b]"
            >
              <BackArrow
                size={14}
                className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
              />

              <span>
                {isArabic
                  ? "العودة إلى السلة"
                  : "Back to cart"}
              </span>
            </Link>
          </aside>
        </div>
      </div>

      {/* Mobile submit */}
      {cart.length > 0 && (
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
              form="checkout-form"
              disabled={
                submitDisabled
              }
              className="flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#b4bdb7]"
            >
              {submitting ||
              checkingBan ? (
                <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <ShieldCheck
                  size={16}
                  className="shrink-0"
                />
              )}

              <span className="truncate">
                {getSubmitText()}
              </span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}