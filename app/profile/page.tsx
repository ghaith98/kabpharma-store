"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaFileContract,
  FaGlobe,
  FaHeadset,
  FaHeart,
  FaShieldAlt,
  FaSignOutAlt,
  FaUndoAlt,
  FaUserCircle,
  FaUserEdit,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

// Module-level cache — survives component unmount/remount (navigation).
// Cleared on logout so stale orders never show for a new session.
type KabUser = {
  full_name: string;
  phone: string;
};

type RecentOrderItem = {
  id: string | number;
  product_name: string;
  quantity: number;
  image_url: string | null;
};

type RecentOrder = {
  id: string | number;
  total_price: number;
  status: string;
  created_at: string | null;
  order_items: RecentOrderItem[];
};

let _cachedOrders: RecentOrder[] | null = null;
let _ordersTimestamp = 0;
const ORDERS_TTL_MS = 60_000; // re-fetch after 1 minute

const orderStatus = {
  en: {
    pending: "Under review",
    accepted: "Order accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    rejected: "Not approved",
    cancelled_by_customer: "Cancelled",
  },
  ar: {
    pending: "قيد المراجعة",
    accepted: "تم قبول الطلب",
    out_for_delivery: "قيد التوصيل",
    delivered: "تم التسليم",
    rejected: "لم تتم الموافقة",
    cancelled_by_customer: "تم الإلغاء",
  },
};

const orderStatusClass: Record<string, string> = {
  pending: "bg-[#fff6dc] text-[#806018]",
  accepted: "bg-[#eaf4ed] text-[#155b38]",
  out_for_delivery: "bg-[#e8f3f7] text-[#275f73]",
  delivered: "bg-[#e3f1e8] text-[#0d6a43]",
  rejected: "bg-[#fff0ee] text-[#a2473e]",
  cancelled_by_customer: "bg-[#edf0ee] text-[#657068]",
};

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<KabUser | null>(null);
  const [pageReady, setPageReady] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const isArabic = lang === "ar";

  useEffect(() => {
    let cancelled = false;

    // Step 1: show cached user instantly — eliminates skeleton on re-visits
    try {
      const cached = localStorage.getItem("kab_user");
      if (cached) {
        const parsed = JSON.parse(cached) as KabUser & { id?: unknown };
        if (parsed.full_name && parsed.phone) {
          if (!cancelled) {
            setUser({ full_name: parsed.full_name, phone: parsed.phone });
            setOrdersLoading(true);
            setPageReady(true);
          }
        }
      }
    } catch {
      // localStorage unavailable — fall through to full load
    }

    // Step 2: verify session + fetch orders in parallel
    // Orders are cached at module level — re-used on remount, only re-fetched after TTL
    async function loadProfile() {
      try {
        const now = Date.now();
        const ordersAreFresh =
          _cachedOrders !== null && now - _ordersTimestamp < ORDERS_TTL_MS;

        // Show cached orders immediately if we have them
        if (ordersAreFresh && !cancelled) {
          setRecentOrders(_cachedOrders!);
          setOrdersLoading(false);
        }

        const mePromise = fetch("/api/customer/me", { credentials: "include", cache: "default" });
        const ordersPromise = ordersAreFresh
          ? Promise.resolve(null)
          : fetch("/api/customer/orders?view=profile", { credentials: "include", cache: "default" });

        const [meResponse, ordersResponse] = await Promise.all([mePromise, ordersPromise]);

        if (!meResponse.ok) {
          localStorage.removeItem("kab_user");
          _cachedOrders = null;
          if (!cancelled) { setUser(null); setRecentOrders([]); }
          return;
        }

        const result = await meResponse.json();

        if (!result.authenticated || !result.user) {
          localStorage.removeItem("kab_user");
          _cachedOrders = null;
          if (!cancelled) { setUser(null); setRecentOrders([]); }
          return;
        }

        const verifiedUser: KabUser = {
          full_name: result.user.full_name,
          phone: result.user.phone,
        };

        localStorage.setItem("kab_user", JSON.stringify({ id: result.user.id, ...verifiedUser }));
        if (!cancelled) setUser(verifiedUser);

        if (ordersResponse && ordersResponse.ok) {
          const ordersResult = await ordersResponse.json();
          const orders = Array.isArray(ordersResult.orders) ? ordersResult.orders : [];
          _cachedOrders = orders;
          _ordersTimestamp = Date.now();
          if (!cancelled) setRecentOrders(orders);
        }
      } catch {
        if (!cancelled) { setUser(null); setRecentOrders([]); }
      } finally {
        if (!cancelled) { setOrdersLoading(false); setPageReady(true); }
      }
    }

    void loadProfile();

    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/customer/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      localStorage.removeItem("kab_user");
      _cachedOrders = null;
      _ordersTimestamp = 0;
      setUser(null);
      setRecentOrders([]);

      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      window.alert(
        isArabic
          ? "تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى."
          : "Could not sign out. Please try again."
      );
    }
  }

  const profileInitial =
    user?.full_name?.trim().charAt(0).toUpperCase() || "";

  const arrowClass = isArabic ? "rotate-180" : "";

  const mobileTileClass =
    "group flex min-h-[72px] items-center justify-between gap-2.5 rounded-[1.25rem] border border-[#d8dfda] bg-white px-3.5 py-3 text-start transition duration-200 active:scale-[0.985] active:border-[#0b5d41] active:bg-[#f4f8f5]";

  const desktopTileClass =
    "group flex min-h-[118px] flex-col justify-between rounded-[1.35rem] border border-[#dde4df] bg-white p-5 text-start transition duration-300 hover:border-[#aac2b4] hover:shadow-[0_12px_30px_rgba(11,66,46,0.07)]";

  const desktopSidebarTileClass =
    "group flex min-h-0 w-full items-center justify-between gap-3 rounded-[1rem] border border-[#dde4df] bg-white px-4 py-2 text-start transition duration-200 hover:border-[#aac2b4] hover:bg-[#f8faf8]";

  const mobilePolicyClass =
    "group flex min-h-[64px] items-center justify-between gap-4 border-t border-[#e8ece9] px-5 py-3.5 transition active:bg-[#f3f6f4]";

  function formattedOrderDate(value: string | null) {
    if (!value) {
      return isArabic ? "تاريخ غير متوفر" : "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return isArabic ? "تاريخ غير متوفر" : "Date unavailable";
    }

    return new Intl.DateTimeFormat(
      isArabic ? "ar-SY" : "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  }

  function formattedOrderTotal(value: number) {
    const amount = new Intl.NumberFormat(
      isArabic ? "ar-SY" : "en-US",
      {
        maximumFractionDigits: 0,
      }
    ).format(Number(value || 0));

    return isArabic
      ? `${amount} ليرة سورية`
      : `${amount} SYP`;
  }

  function renderLatestOrders({
    desktop = false,
  }: {
    desktop?: boolean;
  }) {
    if (!user) {
      return null;
    }

    const statusLabels =
      orderStatus[isArabic ? "ar" : "en"];

    return (
      <section
        className={
          desktop
            ? "rounded-[2rem] border border-[#e0e5e1] bg-white p-7 xl:p-9"
            : "border-b-[10px] border-[#eceee9] bg-white px-4 py-6"
        }
      >
        <div className={desktop ? "" : "mx-auto max-w-md"}>
          <div className="flex items-end justify-between gap-4">
            <div>
              {desktop && (
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#155b38] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.18em]"
                  }`}
                >
                  {isArabic ? "طلباتك" : "Your orders"}
                </p>
              )}
              <h2
                className={
                  desktop
                    ? "mt-2 text-3xl font-extrabold tracking-[-0.03em]"
                    : "text-xl font-extrabold"
                }
              >
                {isArabic ? "أحدث الطلبات" : "Latest orders"}
              </h2>
            </div>

            <Link
              href="/orders"
              className="group inline-flex items-center gap-2 text-xs font-extrabold text-[#155b38] transition hover:text-[#0b452f]"
            >
              {isArabic ? "عرض الكل" : "View all"}
              <FaChevronRight
                className={`${arrowClass} text-[10px] transition-transform group-hover:translate-x-0.5`}
              />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="mt-5 flex gap-3 overflow-hidden">
              {Array.from({ length: desktop ? 3 : 2 }).map((_, index) => (
                <div
                  key={index}
                  className={`kab-shimmer h-[196px] shrink-0 rounded-[1.35rem] bg-[#eef1ee] ${
                    desktop ? "w-[calc(33.333%-0.75rem)]" : "w-[258px]"
                  }`}
                />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="mt-5 rounded-[1.45rem] border border-dashed border-[#cfd8d1] bg-[#fafbf9] px-5 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                <FaBoxOpen />
              </div>
              <p className="mt-3 text-sm font-extrabold">
                {isArabic ? "لا توجد طلبات بعد" : "No orders yet"}
              </p>
              <Link
                href="/products"
                className="mt-2 inline-block text-xs font-bold text-[#155b38] underline decoration-[#aac2b4] underline-offset-4"
              >
                {isArabic ? "ابدأ التسوق" : "Start shopping"}
              </Link>
            </div>
          ) : (
            <Swiper
              key={`${lang}-${desktop ? "desktop" : "mobile"}`}
              dir={isArabic ? "rtl" : "ltr"}
              slidesPerView="auto"
              spaceBetween={desktop ? 14 : 12}
              grabCursor
              watchOverflow
              className="mt-5"
            >
              {recentOrders.map((order) => {
                const items = Array.isArray(order.order_items)
                  ? order.order_items
                  : [];
                const visibleItems = items.slice(0, 3);
                const hiddenItemCount = Math.max(
                  0,
                  items.length - visibleItems.length
                );
                const status =
                  statusLabels[
                    order.status as keyof typeof statusLabels
                  ] ||
                  (isArabic ? "قيد المعالجة" : "Processing");

                return (
                  <SwiperSlide
                    key={order.id}
                    className={`!h-auto ${
                      desktop
                        ? "!w-[276px] xl:!w-[288px]"
                        : "!w-[258px]"
                    }`}
                  >
                    <Link
                      href={`/orders/${order.id}`}
                      aria-label={
                        isArabic
                          ? `عرض تفاصيل الطلب ${order.id}`
                          : `View order ${order.id} details`
                      }
                      className={`group flex h-full flex-col rounded-[1.35rem] border border-[#dfe5e1] bg-[#fbfcfa] p-4 transition-[border-color,box-shadow] duration-300 hover:border-[#adc4b6] hover:shadow-[0_10px_26px_rgba(11,66,46,0.07)] ${
                        desktop ? "min-h-[210px]" : "min-h-[196px]"
                      }`}
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-[#7a867e]">
                          {isArabic ? "رقم الطلب" : "Order"} #{order.id}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#4e5d54]">
                          {formattedOrderDate(order.created_at)}
                        </p>
                      </div>

                      <span
                        className={`max-w-[112px] rounded-full px-2.5 py-1.5 text-center text-[9px] font-extrabold leading-3 ${
                          orderStatusClass[order.status] ||
                          "bg-[#edf0ee] text-[#657068]"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-4 flex min-w-0 items-center">
                      {visibleItems.length > 0 ? (
                        visibleItems.map((item, index) => (
                          <div
                            key={item.id}
                            title={item.product_name}
                            className={`relative flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[0.9rem] border-[3px] border-[#fbfcfa] bg-white p-1.5 shadow-sm ${
                              index > 0 ? "-ms-2.5" : ""
                            }`}
                            style={{
                              zIndex:
                                visibleItems.length - index,
                            }}
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-full w-full object-contain"
                                loading="eager" decoding="async"
                              />
                            ) : (
                              <FaBoxOpen className="text-lg text-[#9aaba0]" />
                            )}
                            {Number(item.quantity || 0) > 1 && (
                              <span className="absolute bottom-0.5 end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#155b38] px-1 text-[9px] font-extrabold text-white">
                                ×{item.quantity}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[0.9rem] bg-[#eaf2ed] text-[#155b38]">
                          <FaBoxOpen />
                        </div>
                      )}

                      {hiddenItemCount > 0 && (
                        <span className="-ms-2 flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-[#edf1ee] px-1 text-[9px] font-extrabold text-[#526058]">
                          +{hiddenItemCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#e7ebe8] pt-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8a958e]">
                          {isArabic ? "الإجمالي" : "Total"}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] font-extrabold text-[#17221b]">
                          {formattedOrderTotal(order.total_price)}
                        </p>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-extrabold text-[#155b38]">
                        {isArabic ? "التفاصيل" : "Details"}
                        <FaChevronRight
                          className={`${arrowClass} text-[8px] transition-transform group-hover:translate-x-0.5`}
                        />
                      </span>
                    </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
      </section>
    );
  }

  if (!pageReady) {
    return (
      <main className="min-h-screen bg-[#f4f5f1]">
        <div className="lg:hidden">
          <div className="h-[92px] animate-pulse bg-[#155b38]" />
          <div className="space-y-4 px-4 py-5">
            <div className="h-24 animate-pulse rounded-[1.5rem] bg-white" />
            <div className="h-20 animate-pulse rounded-[1.4rem] bg-[#20231f]" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.6rem] bg-white"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto hidden max-w-[1380px] px-8 py-12 lg:block">
          <div className="h-60 animate-pulse rounded-[2rem] bg-[#155b38]" />
          <div className="mt-7 grid grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-[1.65rem] bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className={`${user ? "min-h-screen pb-20" : ""} bg-[#f4f5f1] text-[#17221b] ${
        isArabic ? "[font-family:var(--font-arabic)]" : ""
      }`}
    >
      {/* Mobile account center */}
      <div className="lg:hidden">
        <header className="bg-[#155b38] px-5 pb-5 pt-6 text-white">
          <div className="mx-auto flex max-w-md items-center justify-center">
            <h1 className="text-xl font-extrabold">
              {isArabic ? "حسابي" : "My account"}
            </h1>
          </div>
        </header>

        <div className="bg-white px-4 pb-5 pt-5">
          <div className="mx-auto max-w-md">
            {user ? (
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#7a2999] text-2xl font-extrabold uppercase text-white shadow-sm">
                  {profileInitial}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-extrabold">
                      {user.full_name}
                    </h2>
                    <FaUserEdit className="shrink-0 text-sm text-[#66736b]" />
                  </div>

                  <p
                    dir="ltr"
                    className={`mt-1 text-sm text-[#68736c] ${
                      isArabic ? "text-right" : "text-left"
                    }`}
                  >
                    +{user.phone.replace(/^\+/, "")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e9f0eb] text-3xl text-[#155b38]">
                  <FaUserCircle />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold">
                    {isArabic ? "أهلاً بك في KAB" : "Welcome to KAB"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-[#68736c]">
                    {isArabic
                      ? "سجّل دخولك لمتابعة طلباتك وحفظ مفضلاتك."
                      : "Sign in to track orders and save your favorites."}
                  </p>
                </div>
              </div>
            )}

            {!user && (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  href="/login"
                  className="flex min-h-11 items-center justify-center rounded-full bg-[#155b38] px-4 text-sm font-extrabold text-white transition active:scale-[0.98]"
                >
                  {isArabic ? "تسجيل الدخول" : "Sign in"}
                </Link>
                <Link
                  href="/signup"
                  className="flex min-h-11 items-center justify-center rounded-full border border-[#155b38] px-4 text-sm font-extrabold text-[#155b38] transition active:scale-[0.98]"
                >
                  {isArabic ? "إنشاء حساب" : "Create account"}
                </Link>
              </div>
            )}

          </div>
        </div>

        {renderLatestOrders({})}

        <section className="bg-white px-4 py-6">
          <div className="mx-auto max-w-md">
            <h2 className="mb-4 text-xl font-extrabold">
              {isArabic ? "مركز الحساب" : "Account center"}
            </h2>

            <nav
              aria-label={isArabic ? "روابط الحساب" : "Account links"}
              className="grid grid-cols-2 gap-2.5"
            >
              <Link
                href="/account-information"
                className={mobileTileClass}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                    <FaUserEdit />
                  </span>
                  <span className="text-[13px] font-extrabold leading-4">
                    {isArabic ? "معلومات الحساب" : "Account details"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link href="/orders" className={mobileTileClass}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                    <FaBoxOpen />
                  </span>
                  <span className="text-[13px] font-extrabold leading-4">
                    {isArabic ? "الطلبات" : "Orders"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link href="/wishlist" className={mobileTileClass}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                    <FaHeart />
                  </span>
                  <span className="text-[13px] font-extrabold leading-4">
                    {isArabic ? "قائمتي" : "Wishlist"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link href="/contact" className={mobileTileClass}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                    <FaHeadset />
                  </span>
                  <span className="text-[13px] font-extrabold leading-4">
                    {isArabic ? "تواصل معنا" : "Contact us"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <button
                type="button"
                onClick={() => setPoliciesOpen((current) => !current)}
                aria-expanded={policiesOpen}
                aria-controls="mobile-profile-policies"
                className={mobileTileClass}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                    <FaFileContract />
                  </span>
                  <span className="text-[13px] font-extrabold leading-4">
                    {isArabic ? "السياسات" : "Policies"}
                  </span>
                </div>
                <FaChevronDown
                  className={`shrink-0 text-xs text-[#8d9790] transition-transform duration-300 ${
                    policiesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="flex min-h-[72px] min-w-0 items-center gap-2.5 rounded-[1.25rem] border border-[#d8dfda] bg-white px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                  <FaGlobe />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap text-[12px] font-extrabold leading-none">
                    {isArabic ? "اللغة" : "Language"}
                  </span>
                  <div
                    dir="ltr"
                    aria-label={isArabic ? "اختيار اللغة" : "Choose language"}
                    className="mt-1.5 grid min-w-0 grid-cols-2 rounded-full bg-[#edf1ee] p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => setLang("en")}
                      aria-pressed={lang === "en"}
                      className={`flex h-5 min-w-0 items-center justify-center rounded-full px-1 text-[8px] font-extrabold transition ${
                        lang === "en"
                          ? "bg-[#155b38] text-white"
                          : "text-[#68736c]"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang("ar")}
                      aria-pressed={lang === "ar"}
                      className={`flex h-5 min-w-0 items-center justify-center rounded-full px-1 text-[8px] font-extrabold transition ${
                        lang === "ar"
                          ? "bg-[#155b38] text-white"
                          : "text-[#68736c]"
                      }`}
                    >
                      AR
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            <div
              id="mobile-profile-policies"
              className={`grid transition-all duration-300 ease-in-out ${
                policiesOpen
                  ? "mt-3 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <nav className="overflow-hidden rounded-[1.35rem] border border-[#d8dfda] bg-[#fbfcfa]">
                  <Link href="/privacy-policy" className={mobilePolicyClass}>
                    <span className="flex items-center gap-3 text-sm font-bold">
                      <FaShieldAlt className="text-[#155b38]" />
                      {isArabic ? "سياسة الخصوصية" : "Privacy policy"}
                    </span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link href="/terms" className={mobilePolicyClass}>
                    <span className="flex items-center gap-3 text-sm font-bold">
                      <FaFileContract className="text-[#155b38]" />
                      {isArabic ? "الشروط والأحكام" : "Terms & conditions"}
                    </span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link href="/refund-policy" className={mobilePolicyClass}>
                    <span className="flex items-center gap-3 text-sm font-bold">
                      <FaUndoAlt className="text-[#155b38]" />
                      {isArabic ? "سياسة الاسترجاع" : "Refund policy"}
                    </span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                </nav>
              </div>
            </div>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#d5ddd7] bg-white text-sm font-bold text-[#59665e] transition active:bg-[#edf1ee]"
              >
                <FaSignOutAlt />
                {isArabic ? "تسجيل الخروج" : "Sign out"}
              </button>
            )}
          </div>
        </section>

      </div>

      {/* Desktop account dashboard */}
      <div className="mx-auto hidden max-w-[1380px] px-6 pb-14 pt-10 lg:block xl:px-10">
        {user ? (
          <section className="relative overflow-hidden rounded-[2.1rem] bg-[#155b38] text-white shadow-[0_25px_70px_rgba(9,61,39,0.16)]">
            <div className="absolute -end-24 -top-40 h-96 w-96 rounded-full border-[70px] border-white/[0.035]" />
            <div className="absolute bottom-0 start-[42%] h-40 w-40 rounded-full bg-[#a2c84c]/10 blur-3xl" />

            <div className="relative grid min-h-[248px] grid-cols-[minmax(0,1fr)_auto] items-center gap-10 px-10 py-9 xl:px-14">
              <div>
                <p
                  className={`text-xs font-extrabold uppercase text-[#b9d9c6] ${
                    isArabic ? "tracking-normal" : "tracking-[0.2em]"
                  }`}
                >
                  KAB Pharma · {isArabic ? "مركز الحساب" : "Account center"}
                </p>

                <div className="mt-7 flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl font-extrabold uppercase backdrop-blur-sm">
                    {profileInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/60">
                      {isArabic ? "تم تسجيل الدخول باسم" : "Signed in as"}
                    </p>
                    <h1 className="mt-1 truncate text-4xl font-extrabold tracking-[-0.035em]">
                      {user.full_name}
                    </h1>
                    <p
                      dir="ltr"
                      className={`mt-2 text-sm text-white/60 ${
                        isArabic ? "text-right" : ""
                      }`}
                    >
                      +{user.phone.replace(/^\+/, "")}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-xs font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <FaSignOutAlt />
                {isArabic ? "تسجيل الخروج" : "Sign out"}
              </button>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[2rem] border border-[#dce4de] bg-[#fbfcf9] shadow-[0_20px_55px_rgba(11,66,46,0.08)]">
            <div className="grid min-h-[330px] grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
              <div className="relative flex flex-col justify-center overflow-hidden bg-[#155b38] px-10 py-11 text-white xl:px-14">
                <div className="absolute -end-20 -top-24 h-64 w-64 rounded-full border-[52px] border-white/[0.04]" />
                <div className="absolute -bottom-24 start-16 h-48 w-48 rounded-full bg-[#a2c84c]/10 blur-3xl" />

                <div className="relative max-w-xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl">
                    <FaUserCircle />
                  </div>
                  <p
                    className={`mt-6 text-[11px] font-extrabold uppercase text-[#b9d9c6] ${
                      isArabic ? "tracking-normal" : "tracking-[0.2em]"
                    }`}
                  >
                    KAB Pharma · {isArabic ? "مركز الحساب" : "Account center"}
                  </p>
                  <h1 className="mt-2.5 text-4xl font-extrabold tracking-[-0.035em] xl:text-[42px]">
                    {isArabic ? "مرحباً بك في KAB" : "Welcome to KAB"}
                  </h1>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
                    {isArabic
                      ? "سجّل دخولك لمتابعة طلباتك، حفظ منتجاتك المفضلة، وإدارة حسابك بسهولة."
                      : "Sign in to track every order, keep your favorite products, and manage your account with ease."}
                  </p>

                  <div className="mt-7 flex items-center gap-3">
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-extrabold text-[#155b38] transition hover:bg-[#f0f5f1]"
                    >
                      {isArabic ? "تسجيل الدخول" : "Sign in"}
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-7 text-sm font-extrabold text-white transition hover:bg-white/10"
                    >
                      {isArabic ? "إنشاء حساب" : "Create account"}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center px-9 py-10 xl:px-12">
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#155b38] ${
                    isArabic ? "tracking-normal" : "tracking-[0.18em]"
                  }`}
                >
                  {isArabic ? "مزايا حسابك" : "Your account benefits"}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em]">
                  {isArabic
                    ? "تسوّق أسهل، ومتابعة أوضح"
                    : "A simpler way to shop"}
                </h2>

                <div className="mt-6 grid gap-3">
                  <div className="flex items-center gap-4 rounded-[1.2rem] border border-[#e0e6e2] bg-white px-4 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                      <FaBoxOpen />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">
                        {isArabic ? "متابعة الطلبات" : "Track your orders"}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#68736c]">
                        {isArabic
                          ? "اعرف حالة طلبك في كل خطوة."
                          : "See every update from review to delivery."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-[1.2rem] border border-[#e0e6e2] bg-white px-4 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                      <FaHeart />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">
                        {isArabic ? "حفظ المفضلة" : "Save your favorites"}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#68736c]">
                        {isArabic
                          ? "احتفظ بالمنتجات التي تحبها."
                          : "Keep the products you love close at hand."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-[1.2rem] border border-[#e0e6e2] bg-white px-4 py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                      <FaUserEdit />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">
                        {isArabic ? "إدارة الحساب" : "Manage account details"}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#68736c]">
                        {isArabic
                          ? "حدّث معلوماتك من مكان واحد."
                          : "Keep your account information up to date."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {user && (
          <div className="mt-7">
            {renderLatestOrders({
              desktop: true,
            })}
          </div>
        )}

        <div className="mt-6 grid items-stretch gap-x-4 gap-y-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="contents">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#155b38] ${
                    isArabic ? "tracking-normal" : "tracking-[0.18em]"
                  }`}
                >
                  {isArabic ? "إدارة حسابك" : "Manage your account"}
                </p>
                <h2 className="mt-1.5 text-[26px] font-extrabold tracking-[-0.03em]">
                  {isArabic ? "كل شيء في مكان واحد" : "Everything in one place"}
                </h2>
              </div>
            </div>

            <nav
              aria-label={isArabic ? "روابط الحساب" : "Account links"}
              className="grid grid-cols-3 gap-3.5 lg:col-start-1 lg:row-start-2"
            >
              <Link
                href="/account-information"
                className={desktopTileClass}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                  <FaUserEdit />
                </div>
                <div className="mt-3.5 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold">
                      {isArabic ? "معلومات الحساب" : "Account details"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#68736c]">
                      {isArabic
                        ? "حدّث اسمك ورقم هاتفك."
                        : "Update your name and phone."}
                    </p>
                  </div>
                  <FaChevronRight
                    className={`${arrowClass} shrink-0 text-xs text-[#95a098] transition group-hover:text-[#155b38]`}
                  />
                </div>
              </Link>

              <Link href="/orders" className={desktopTileClass}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                  <FaBoxOpen />
                </div>
                <div className="mt-3.5 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold">
                      {isArabic ? "الطلبات" : "Orders"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#68736c]">
                      {isArabic
                        ? "تابع طلباتك السابقة والحالية."
                        : "Track current and past orders."}
                    </p>
                  </div>
                  <FaChevronRight
                    className={`${arrowClass} shrink-0 text-xs text-[#95a098] transition group-hover:text-[#155b38]`}
                  />
                </div>
              </Link>

              <Link href="/wishlist" className={desktopTileClass}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eaf2ed] text-sm text-[#155b38]">
                  <FaHeart />
                </div>
                <div className="mt-3.5 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold">
                      {isArabic ? "قائمتي" : "Wishlist"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#68736c]">
                      {isArabic
                        ? "ارجع بسهولة إلى منتجاتك المفضلة."
                        : "Return to products you saved."}
                    </p>
                  </div>
                  <FaChevronRight
                    className={`${arrowClass} shrink-0 text-xs text-[#95a098] transition group-hover:text-[#155b38]`}
                  />
                </div>
              </Link>
            </nav>
          </section>

          <aside className="relative grid h-full grid-rows-3 gap-2 lg:col-start-2 lg:row-start-2">
              <div className={desktopSidebarTileClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-xs text-[#155b38]">
                    <FaGlobe />
                  </span>
                  <h3 className="truncate text-sm font-extrabold">
                    {isArabic ? "اللغة" : "Language"}
                  </h3>
                </div>

                <div
                  dir="ltr"
                  aria-label={isArabic ? "اختيار اللغة" : "Choose language"}
                  className="grid shrink-0 grid-cols-2 rounded-full bg-[#edf1ee] p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    aria-pressed={lang === "en"}
                    className={`flex h-6 min-w-9 items-center justify-center rounded-full px-1.5 text-[8px] font-extrabold transition ${
                      lang === "en"
                        ? "bg-[#155b38] text-white"
                        : "text-[#59665e]"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("ar")}
                    aria-pressed={lang === "ar"}
                    className={`flex h-6 min-w-9 items-center justify-center rounded-full px-1.5 text-[8px] font-extrabold transition ${
                      lang === "ar"
                        ? "bg-[#155b38] text-white"
                        : "text-[#59665e]"
                    }`}
                  >
                    AR
                  </button>
                </div>
              </div>

              <Link href="/contact" className={desktopSidebarTileClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-xs text-[#155b38]">
                    <FaHeadset />
                  </span>
                  <h3 className="truncate text-sm font-extrabold">
                    {isArabic ? "تواصل معنا" : "Contact us"}
                  </h3>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-[10px] text-[#95a098] transition group-hover:text-[#155b38]`}
                />
              </Link>

              <button
                type="button"
                onClick={() => setPoliciesOpen((current) => !current)}
                aria-expanded={policiesOpen}
                aria-controls="desktop-profile-policies"
                className={desktopSidebarTileClass}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ed] text-xs text-[#155b38]">
                    <FaFileContract />
                  </span>
                  <h3 className="truncate text-sm font-extrabold">
                    {isArabic ? "السياسات" : "Policies"}
                  </h3>
                </div>
                <FaChevronDown
                  className={`shrink-0 text-[10px] text-[#95a098] transition-transform duration-300 ${
                    policiesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

            <div
              id="desktop-profile-policies"
              className={`absolute end-0 top-[calc(100%+0.75rem)] z-20 grid w-full transition-all duration-300 ease-in-out ${
                policiesOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "pointer-events-none grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <nav className="grid gap-1 rounded-[1.4rem] border border-[#dce3de] bg-white p-3 shadow-[0_18px_45px_rgba(11,66,46,0.12)]">
                  <Link
                    href="/privacy-policy"
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "سياسة الخصوصية" : "Privacy policy"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link
                    href="/terms"
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "الشروط والأحكام" : "Terms & conditions"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link
                    href="/refund-policy"
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "سياسة الاسترجاع" : "Refund policy"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                </nav>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}