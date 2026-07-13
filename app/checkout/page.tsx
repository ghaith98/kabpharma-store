"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CartItem, getCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

type CartItemWithVariant = CartItem & {
  cart_key?: string;
  product_name?: string;
  variant_id?: number | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
};

type StoredUser = {
  full_name?: string;
  phone?: string;
};

type BanCheckResult = {
  is_banned?: boolean;
  reason?: string | null;
};

export default function CheckoutPage() {
  const { lang } = useLanguage();

  const [cart, setCart] = useState<CartItemWithVariant[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [address, setAddress] = useState("");

  const [checkingBan, setCheckingBan] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [accountCheckError, setAccountCheckError] = useState("");

  const isArabic = lang === "ar";

  useEffect(() => {
    setCart(getCart() as CartItemWithVariant[]);
    loadDeliveryData();

    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) {
      localStorage.setItem("redirect_after_login", "/checkout");
      window.location.href = "/profile?account_required=1";
      return;
    }

    let user: StoredUser;

    try {
      user = JSON.parse(savedUser) as StoredUser;
    } catch {
      localStorage.removeItem("kab_user");
      localStorage.setItem("redirect_after_login", "/checkout");
      window.location.href = "/login";
      return;
    }

    if (!user.phone) {
      localStorage.removeItem("kab_user");
      localStorage.setItem("redirect_after_login", "/checkout");
      window.location.href = "/login";
      return;
    }

    const accountPhone = String(user.phone).trim();

    setPhone(accountPhone);

    const savedCheckout = localStorage.getItem("checkout");

    if (savedCheckout) {
      try {
        const checkout = JSON.parse(savedCheckout);

        setName(checkout.name || user.full_name || "");
        setGovernorate(checkout.governorate || "");
        setAddress(checkout.address || "");

        /*
          لا نستخدم رقم الهاتف المحفوظ داخل checkout.
          رقم الطلب دائماً يأتي من الحساب الحالي.
        */
        setPhone(accountPhone);
      } catch {
        localStorage.removeItem("checkout");
        setName(user.full_name || "");
        setPhone(accountPhone);
      }
    } else {
      setName(user.full_name || "");
      setPhone(accountPhone);
    }

    checkCurrentUserBan(accountPhone).finally(() => {
      setCheckingBan(false);
    });
  }, []);

  useEffect(() => {
    const savedCheckout = localStorage.getItem("checkout");

    if (!savedCheckout || deliveryAreas.length === 0) {
      return;
    }

    try {
      const checkout = JSON.parse(savedCheckout);

      const matchedArea = deliveryAreas.find(
        (area) =>
          area.area_name === checkout.delivery_area &&
          area.governorate === checkout.governorate
      );

      if (matchedArea) {
        setDeliveryArea(String(matchedArea.id));
      }
    } catch {
      localStorage.removeItem("checkout");
    }
  }, [deliveryAreas]);

  async function checkCurrentUserBan(accountPhone: string) {
    setAccountCheckError("");

    const normalizedPhone = String(accountPhone || "").trim();

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

    const { data, error } = await supabase.rpc("check_user_ban", {
      p_phone: normalizedPhone,
    });

    if (error) {
      console.error("Failed to check user restriction:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

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

    const result: BanCheckResult | null = Array.isArray(data)
      ? (data[0] as BanCheckResult | undefined) || null
      : (data as BanCheckResult | null);

    const banned = Boolean(result?.is_banned);

    setIsBanned(banned);

    return {
      banned,
      error: false,
    };
  }

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

  const productsTotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
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
    freeShippingThreshold > 0 &&
    productsTotal >= freeShippingThreshold;

  const deliveryFee = hasFreeShipping ? 0 : rawDeliveryFee;

  const total = productsTotal + deliveryFee;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (checkingBan) {
      return;
    }

    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) {
      localStorage.setItem("redirect_after_login", "/checkout");
      window.location.href = "/profile?account_required=1";
      return;
    }

    let currentUser: StoredUser;

    try {
      currentUser = JSON.parse(savedUser) as StoredUser;
    } catch {
      localStorage.removeItem("kab_user");
      localStorage.setItem("redirect_after_login", "/checkout");
      window.location.href = "/login";
      return;
    }

    const accountPhone = String(currentUser.phone || "").trim();

    const banStatus = await checkCurrentUserBan(accountPhone);

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

    if (cart.length === 0) {
      alert(isArabic ? "السلة فارغة" : "Your cart is empty");
      return;
    }

    if (!name.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال الاسم الكامل"
          : "Please enter your full name"
      );

      return;
    }

    if (!governorate) {
      alert(
        isArabic
          ? "يرجى اختيار المحافظة"
          : "Please select governorate"
      );

      return;
    }

    if (!deliveryArea) {
      alert(
        isArabic
          ? "يرجى اختيار منطقة التوصيل"
          : "Please select delivery area"
      );

      return;
    }

    if (!address.trim()) {
      alert(
        isArabic
          ? "يرجى إدخال عنوان التوصيل"
          : "Please enter the delivery address"
      );

      return;
    }

    localStorage.setItem(
      "checkout",
      JSON.stringify({
        name: name.trim(),

        /*
          رقم الطلب يأتي من الحساب الحالي دائماً.
        */
        phone: accountPhone,

        governorate,
        delivery_area: selectedArea?.area_name || "",
        delivery_area_ar: selectedArea?.area_name_ar || "",
        delivery_area_en: selectedArea?.area_name_en || "",
        address: address.trim(),
        delivery_fee: deliveryFee,
      })
    );

    window.location.href = "/payment";
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-5xl">
        {/* Checkout progress */}
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
              {isArabic ? "معلومات الطلب" : "Checkout"}
            </span>

            <span className="text-gray-500">
              {isArabic ? "الدفع" : "Payment"}
            </span>
          </div>
        </div>

        {/* Page header */}
        <section className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {isArabic ? "إتمام الطلب" : "Checkout"}
          </h1>

          <p className="mt-3 text-gray-700">
            {isArabic
              ? "أضف تفاصيل التوصيل للمتابعة إلى الدفع."
              : "Add your delivery details to continue to payment."}
          </p>
        </section>

        {/* Restricted account */}
        {isBanned && (
          <section className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-5 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              !
            </div>

            <h2 className="mt-3 text-xl font-extrabold text-red-800">
              {isArabic
                ? "إتمام الطلبات غير متاح حالياً"
                : "Checkout is currently unavailable"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {isArabic
                ? "يمكنك تسجيل الدخول ومشاهدة المنتجات وطلباتك السابقة، ولكن لا يمكن إرسال طلب جديد من هذا الحساب حالياً. يرجى التواصل معنا للمساعدة."
                : "You can still sign in, browse products and view previous orders, but this account cannot place a new order at the moment. Please contact us for assistance."}
            </p>

            <a
              href="/contact"
              className="mt-4 inline-flex rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
            >
              {isArabic ? "تواصل معنا" : "Contact Us"}
            </a>
          </section>
        )}

        {/* Account verification error */}
        {accountCheckError && !isBanned && (
          <section className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-center">
            <p className="font-bold text-yellow-800">
              {accountCheckError}
            </p>

            <button
              type="button"
              onClick={async () => {
                setCheckingBan(true);

                const savedUser = localStorage.getItem("kab_user");

                if (!savedUser) {
                  window.location.href = "/login";
                  return;
                }

                try {
                  const user = JSON.parse(savedUser) as StoredUser;

                  await checkCurrentUserBan(
                    String(user.phone || "").trim()
                  );
                } finally {
                  setCheckingBan(false);
                }
              }}
              className="mt-3 rounded-xl bg-yellow-600 px-4 py-2 font-bold text-white transition hover:bg-yellow-700"
            >
              {isArabic ? "إعادة المحاولة" : "Try Again"}
            </button>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Delivery form */}
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-3xl bg-white p-5 shadow-sm sm:p-8"
          >
            <h2 className="mb-6 text-xl font-extrabold text-gray-900">
              {isArabic
                ? "معلومات التوصيل"
                : "Delivery Information"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={
                  isArabic ? "الاسم الكامل" : "Full Name"
                }
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />

              <div>
                <input
                  type="tel"
                  value={phone}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[16px] text-gray-700 outline-none"
                />

                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {isArabic
                    ? "رقم الهاتف مرتبط بحسابك."
                    : "This phone number is linked to your account."}
                </p>
              </div>

              <select
                value={governorate}
                onChange={(event) => {
                  setGovernorate(event.target.value);
                  setDeliveryArea("");
                }}
                required
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black outline-none transition focus:border-green-600"
              >
                <option value="">
                  {isArabic
                    ? "اختر المحافظة"
                    : "Select Governorate"}
                </option>

                {governorates.map((item) => (
                  <option
                    key={item.id}
                    value={item.governorate}
                  >
                    {isArabic
                      ? item.governorate_ar ||
                        item.governorate
                      : item.governorate_en ||
                        item.governorate}
                  </option>
                ))}
              </select>

              <select
                value={deliveryArea}
                onChange={(event) =>
                  setDeliveryArea(event.target.value)
                }
                required
                disabled={!governorate}
                className="w-full rounded-2xl border border-gray-300 p-4 text-[16px] text-black outline-none transition focus:border-green-600 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {governorate
                    ? isArabic
                      ? "اختر المنطقة"
                      : "Select Area"
                    : isArabic
                    ? "اختر المحافظة أولاً"
                    : "Select governorate first"}
                </option>

                {areasForGovernorate.map((area) => (
                  <option key={area.id} value={area.id}>
                    {isArabic
                      ? area.area_name_ar ||
                        area.area_name
                      : area.area_name_en ||
                        area.area_name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder={
                  isArabic
                    ? "تفاصيل عنوان التوصيل"
                    : "Delivery Address Details"
                }
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                required
                rows={5}
                className="w-full resize-none rounded-2xl border border-gray-300 p-4 text-[16px] text-black placeholder:text-gray-500 outline-none transition focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              disabled={
                checkingBan ||
                isBanned ||
                Boolean(accountCheckError)
              }
              className="mt-6 w-full rounded-2xl bg-green-600 py-4 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {checkingBan
                ? isArabic
                  ? "جاري التحقق من الحساب..."
                  : "Checking account..."
                : isBanned
                ? isArabic
                  ? "إتمام الطلب غير متاح"
                  : "Checkout Unavailable"
                : accountCheckError
                ? isArabic
                  ? "تعذر التحقق من الحساب"
                  : "Account Check Failed"
                : isArabic
                ? "المتابعة إلى الدفع"
                : "Continue To Payment"}
            </button>
          </form>

          {/* Order summary */}
          <aside className="h-fit min-w-0 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
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
                      className="flex min-w-0 justify-between gap-3 text-sm"
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
                            {isArabic ? "الكمية" : "Qty"}:{" "}
                            {item.quantity}
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
                  {isArabic ? "المنتجات" : "Products"}
                </span>

                <span>
                  {productsTotal.toLocaleString()} SYP
                </span>
              </div>

              <div className="flex justify-between font-bold text-gray-800">
                <span>
                  {isArabic ? "التوصيل" : "Delivery"}
                </span>

                <span>
                  {hasFreeShipping
                    ? isArabic
                      ? "مجاني"
                      : "Free"
                    : `${deliveryFee.toLocaleString()} SYP`}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between gap-4 text-lg font-extrabold text-gray-900">
              <span>
                {isArabic ? "الإجمالي" : "Total"}
              </span>

              <span className="text-green-700">
                {total.toLocaleString()} SYP
              </span>
            </div>

            <a
              href="/cart"
              className="mt-4 block text-center text-sm font-bold text-green-700 transition hover:text-green-800"
            >
              {isArabic
                ? "العودة إلى السلة"
                : "Back to Cart"}
            </a>
          </aside>
        </div>
      </div>
    </main>
  );
}