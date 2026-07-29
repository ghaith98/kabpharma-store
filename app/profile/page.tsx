"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type KabUser = {
  full_name: string;
  phone: string;
};

type Order = {
  id: number;
  status: string;
  total_price: number;
};

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<KabUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageReady, setPageReady] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  const isArabic = lang === "ar";

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          localStorage.removeItem("kab_user");
          return;
        }

        const result = await response.json();

        if (!result.authenticated || !result.user) {
          localStorage.removeItem("kab_user");
          return;
        }

        const verifiedUser: KabUser = {
          full_name: result.user.full_name,
          phone: result.user.phone,
        };

        localStorage.setItem(
          "kab_user",
          JSON.stringify({ id: result.user.id, ...verifiedUser })
        );

        if (!cancelled) setUser(verifiedUser);

        // Load recent orders
        try {
          const ordersRes = await fetch("/api/customer/orders", {
            credentials: "include",
            cache: "no-store",
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (!cancelled && Array.isArray(ordersData.orders)) {
              setOrders(ordersData.orders.slice(0, 3));
            }
          }
        } catch { /* non-critical */ }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setPageReady(true);
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

      if (!response.ok) throw new Error("Logout failed");

      localStorage.removeItem("kab_user");
      setUser(null);
      setOrders([]);
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

  function getStatusLabel(status: string) {
    const map: Record<string, { ar: string; en: string; color: string }> = {
      pending:          { ar: "قيد المراجعة",     en: "Pending",          color: "text-amber-600 bg-amber-50" },
      accepted:         { ar: "تم القبول",         en: "Accepted",         color: "text-blue-600 bg-blue-50" },
      out_for_delivery: { ar: "قيد التوصيل",       en: "Out for delivery", color: "text-indigo-600 bg-indigo-50" },
      delivered:        { ar: "تم التسليم",        en: "Delivered",        color: "text-[#0a583b] bg-[#edf5f0]" },
      rejected:         { ar: "مرفوض",             en: "Rejected",         color: "text-red-600 bg-red-50" },
      cancelled_by_customer: { ar: "ملغي",         en: "Cancelled",        color: "text-[#647168] bg-[#f3f5f3]" },
    };
    const s = map[status] || { ar: status, en: status, color: "text-[#647168] bg-[#f3f5f3]" };
    return { label: isArabic ? s.ar : s.en, color: s.color };
  }

  function formatPrice(v: number) {
    return `${Math.round(v).toLocaleString()} SYP`;
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (!pageReady) {
    return (
      <main dir="ltr" className="min-h-screen bg-[#f7f7f3]">
        {/* Mobile skeleton */}
        <div className="mx-auto max-w-md px-4 py-5 lg:hidden">
          <div className="h-[130px] animate-pulse rounded-[1.5rem] bg-[#0a583b]/80" />
          <div className="mt-4 h-[160px] animate-pulse rounded-[1.25rem] bg-white" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-[1rem] bg-white" />
            <div className="h-20 animate-pulse rounded-[1rem] bg-white" />
            <div className="h-20 animate-pulse rounded-[1rem] bg-white" />
            <div className="h-20 animate-pulse rounded-[1rem] bg-white" />
          </div>
        </div>
        {/* Desktop skeleton */}
        <div className="mx-auto hidden max-w-[1240px] px-8 py-12 lg:block">
          <div className="h-8 w-32 animate-pulse rounded-full bg-[#e4e8e4]" />
          <div className="mt-6 h-[500px] animate-pulse rounded-[2rem] bg-white" />
        </div>
      </main>
    );
  }

  // ── Action grid items ─────────────────────────────────────────────────────────
  const actionItems = [
    { href: "/orders",              icon: <FaBoxOpen />,     labelAr: "الطلبات",          labelEn: "Orders" },
    { href: "/contact",             icon: <FaHeadset />,     labelAr: "تواصل معنا",       labelEn: "Contact us",    badge: true },
    { href: "/wishlist",            icon: <FaHeart />,       labelAr: "قوائمي",           labelEn: "Wishlist" },
    { href: "/account-information", icon: <FaUserEdit />,    labelAr: "معلومات الحساب",   labelEn: "Account info" },
  ];

  return (
    <main
      dir="ltr"
      className={`min-h-screen bg-[#f7f7f3] pb-24 ${isArabic ? "[font-family:var(--font-arabic)]" : ""}`}
    >

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">

        {/* Green header bar — tall enough for card to overlap nicely */}
        <div className="bg-[#073f2c] px-4 pb-16 pt-5 text-white">
          <div className="mx-auto max-w-md">
            <p className={`text-center text-base font-extrabold ${isArabic ? "[font-family:var(--font-arabic)]" : "tracking-[-0.01em]"}`}>
              {isArabic ? "حسابي" : "My account"}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-md px-4">

          {/* User card — overlaps the green header */}
          {user ? (
            <div className="-mt-12 overflow-hidden rounded-[1.5rem] border border-[#e2e7e3] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.12)]">
              <div className="flex items-center gap-4 p-5">
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#073f2c] text-xl font-extrabold uppercase text-white">
                  {profileInitial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0a583b]">
                    {isArabic ? "حساب كاب فارما" : "KAB Pharma account"}
                  </p>
                  <h1 className="mt-0.5 truncate text-lg font-extrabold text-[#142019]">
                    {user.full_name}
                  </h1>
                </div>

                <Link
                  href="/account-information"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e7e3] text-xs text-[#647168] transition hover:border-[#0a583b] hover:text-[#0a583b]"
                  aria-label={isArabic ? "تعديل الحساب" : "Edit account"}
                >
                  <FaUserEdit />
                </Link>
              </div>

              {/* Recent orders inline */}
              {orders.length > 0 && (
                <div className="border-t border-[#edf0ed] px-5 pb-4 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#647168]">
                      {isArabic ? "الطلبات الأخيرة" : "Recent orders"}
                    </p>
                    <Link href="/orders" className="text-xs font-extrabold text-[#0a583b]">
                      {isArabic ? "عرض الكل" : "View all"}
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {orders.map((order) => {
                      const { label, color } = getStatusLabel(order.status);
                      return (
                        <Link
                          key={order.id}
                          href="/orders"
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f8f6] px-3.5 py-3 transition active:bg-[#edf5f0]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs text-[#0a583b]">
                              <FaBoxOpen />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-[#142019]">
                                {isArabic ? `طلب #${order.id}` : `Order #${order.id}`}
                              </p>
                              <p className="text-[10px] text-[#647168]">
                                {formatPrice(order.total_price)}
                              </p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${color}`}>
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Guest card */
            <div className="-mt-12 overflow-hidden rounded-[1.5rem] border border-[#e2e7e3] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.12)]">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xl text-[#0a583b]">
                    <FaUserCircle />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#0a583b]">
                      {isArabic ? "حساب كاب فارما" : "KAB Pharma account"}
                    </p>
                    <h1 className="mt-0.5 text-base font-extrabold text-[#142019]">
                      {isArabic ? "أهلاً بك" : "Welcome"}
                    </h1>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#073f2c] text-sm font-extrabold text-white transition active:scale-[0.98]">
                    {isArabic ? "إنشاء حساب" : "Create account"}
                  </Link>
                  <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#dde4df] text-sm font-extrabold text-[#142019] transition active:scale-[0.98]">
                    {isArabic ? "تسجيل الدخول" : "Sign in"}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 2-column action grid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {actionItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-start justify-between rounded-[1rem] border border-[#e2e7e3] bg-white p-4 transition active:bg-[#f3f6f4]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f0] text-sm text-[#0a583b]">
                  {item.icon}
                </div>
                <div className="mt-4 flex w-full items-end justify-between gap-2">
                  <span className="text-sm font-extrabold text-[#142019]">
                    {isArabic ? item.labelAr : item.labelEn}
                  </span>
                  {item.badge && (
                    <span className="mb-0.5 h-2 w-2 shrink-0 rounded-full bg-[#22a66f]" />
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Language + Policies row */}
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-[#e2e7e3] bg-white">
            {/* Language */}
            <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs text-[#0a583b]">
                  <FaGlobe />
                </div>
                <span className="text-sm font-extrabold text-[#142019]">
                  {isArabic ? "اللغة" : "Language"}
                </span>
              </div>
              <div dir="ltr" className="flex rounded-full bg-[#f1f4f2] p-1">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  className={`flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${lang === "en" ? "bg-[#0a583b] text-white" : "text-[#647168]"}`}
                >EN</button>
                <button
                  type="button"
                  onClick={() => setLang("ar")}
                  aria-pressed={lang === "ar"}
                  className={`flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${lang === "ar" ? "bg-[#0a583b] text-white" : "text-[#647168]"}`}
                >AR</button>
              </div>
            </div>

            {/* Policies accordion */}
            <button
              type="button"
              onClick={() => setPoliciesOpen((o) => !o)}
              aria-expanded={policiesOpen}
              className="flex min-h-[64px] w-full items-center justify-between gap-4 border-t border-[#edf0ed] px-4 py-3 text-start transition active:bg-[#f3f6f4]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-xs text-[#0a583b]">
                  <FaFileContract />
                </div>
                <span className="text-sm font-extrabold text-[#142019]">
                  {isArabic ? "السياسات" : "Policies"}
                </span>
              </div>
              <FaChevronDown className={`shrink-0 text-xs text-[#96a098] transition-transform duration-300 ${policiesOpen ? "rotate-180" : ""}`} />
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${policiesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <Link href="/privacy-policy" className="flex min-h-[56px] items-center justify-between gap-4 border-t border-[#edf0ed] px-4 py-3 transition active:bg-[#f3f6f4]">
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="shrink-0 text-[#0a583b]" />
                    <span className="text-sm font-bold text-[#526057]">{isArabic ? "سياسة الخصوصية" : "Privacy policy"}</span>
                  </div>
                  <FaChevronRight className="shrink-0 text-[10px] text-[#99a29c]" />
                </Link>
                <Link href="/terms" className="flex min-h-[56px] items-center justify-between gap-4 border-t border-[#edf0ed] px-4 py-3 transition active:bg-[#f3f6f4]">
                  <div className="flex items-center gap-3">
                    <FaFileContract className="shrink-0 text-[#0a583b]" />
                    <span className="text-sm font-bold text-[#526057]">{isArabic ? "الشروط والأحكام" : "Terms & conditions"}</span>
                  </div>
                  <FaChevronRight className="shrink-0 text-[10px] text-[#99a29c]" />
                </Link>
                <Link href="/refund-policy" className="flex min-h-[56px] items-center justify-between gap-4 border-t border-[#edf0ed] px-4 py-3 transition active:bg-[#f3f6f4]">
                  <div className="flex items-center gap-3">
                    <FaUndoAlt className="shrink-0 text-[#0a583b]" />
                    <span className="text-sm font-bold text-[#526057]">{isArabic ? "سياسة الاسترجاع" : "Refund policy"}</span>
                  </div>
                  <FaChevronRight className="shrink-0 text-[10px] text-[#99a29c]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sign out */}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-[#78837b] transition active:bg-[#e9edea] active:text-[#142019]"
            >
              <FaSignOutAlt />
              <span>{isArabic ? "تسجيل الخروج" : "Sign out"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto hidden max-w-[1240px] px-4 pb-10 pt-10 sm:px-6 lg:block lg:px-8 lg:pt-14">

        {/* Page header */}
        <div className={`mb-8 ${isArabic ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#0a583b]" />
            <p className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.2em]"}`}>
              KAB Pharma
            </p>
          </div>
          <h1 className={`mt-4 text-[2.8rem] font-extrabold text-[#142019] ${isArabic ? "tracking-normal" : "tracking-[-0.045em]"}`}>
            {isArabic ? "حسابي" : "My account"}
          </h1>
        </div>

        {/* Main grid: user card + content */}
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

          {/* Left: user card + nav */}
          <div className="space-y-4">
            {/* User card */}
            <div className="overflow-hidden rounded-[1.5rem] border border-[#dde4df] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.05)]">
              {user ? (
                <div>
                  {/* Green top band */}
                  <div className="relative overflow-hidden bg-[#073f2c] px-6 pt-6 pb-7 text-white">
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/[0.04]" />
                    <div className="absolute -left-4 -bottom-6 h-20 w-20 rounded-full bg-white/[0.03]" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-extrabold uppercase">
                        {profileInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/55">
                          {isArabic ? "تم تسجيل الدخول" : "Signed in"}
                        </p>
                        <h2 className="mt-0.5 truncate text-lg font-extrabold">{user.full_name}</h2>
                      </div>
                      <Link
                        href="/account-information"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] text-white/60 transition hover:border-white/40 hover:text-white"
                        aria-label={isArabic ? "تعديل" : "Edit"}
                      >
                        <FaUserEdit />
                      </Link>
                    </div>
                  </div>

                  {/* Nav links */}
                  <nav className="divide-y divide-[#edf0ed] px-2 py-2">
                    {[
                      { href: "/orders",              icon: <FaBoxOpen />,  labelAr: "طلباتي",          labelEn: "My orders" },
                      { href: "/wishlist",             icon: <FaHeart />,    labelAr: "قائمة الأمنيات",  labelEn: "Wishlist" },
                      { href: "/account-information",  icon: <FaUserEdit />, labelAr: "معلومات الحساب",  labelEn: "Account information" },
                      { href: "/contact",              icon: <FaHeadset />,  labelAr: "خدمة العملاء",    labelEn: "Customer care", badge: true },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-[#526057] transition hover:bg-[#f3f7f4] hover:text-[#0a583b]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-[#0a583b]/70 transition group-hover:text-[#0a583b]">{item.icon}</span>
                          {isArabic ? item.labelAr : item.labelEn}
                        </span>
                        <div className="flex items-center gap-2">
                          {"badge" in item && item.badge && (
                            <span className="h-2 w-2 rounded-full bg-[#22a66f]" />
                          )}
                          <FaChevronRight className="text-[10px] text-[#c5cfc7] transition group-hover:text-[#0a583b]" />
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-2xl text-[#0a583b]">
                    <FaUserCircle />
                  </div>
                  <h2 className="mt-4 text-lg font-extrabold text-[#142019]">
                    {isArabic ? "أهلاً بك" : "Welcome"}
                  </h2>
                  <p className="mt-1 text-sm text-[#647168]">
                    {isArabic ? "سجّل دخولك لمتابعة طلباتك." : "Sign in to view and track your orders."}
                  </p>
                  <div className="mt-5 space-y-2.5">
                    <Link href="/signup" className="flex min-h-11 items-center justify-center rounded-full bg-[#073f2c] text-sm font-extrabold text-white transition hover:bg-[#0a583b]">
                      {isArabic ? "إنشاء حساب" : "Create account"}
                    </Link>
                    <Link href="/login" className="flex min-h-11 items-center justify-center rounded-full border border-[#dde4df] text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]">
                      {isArabic ? "تسجيل الدخول" : "Sign in"}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Language switcher */}
            <div className="flex items-center justify-between rounded-[1.25rem] border border-[#dde4df] bg-white px-5 py-4">
              <div className="flex items-center gap-2.5 text-sm font-bold text-[#526057]">
                <FaGlobe className="text-[#0a583b]" />
                {isArabic ? "اللغة" : "Language"}
              </div>
              <div dir="ltr" className="flex rounded-full bg-[#f1f4f2] p-1">
                <button type="button" onClick={() => setLang("en")} aria-pressed={lang === "en"}
                  className={`flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${lang === "en" ? "bg-[#0a583b] text-white" : "text-[#647168]"}`}>
                  EN
                </button>
                <button type="button" onClick={() => setLang("ar")} aria-pressed={lang === "ar"}
                  className={`flex h-8 min-w-10 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${lang === "ar" ? "bg-[#0a583b] text-white" : "text-[#647168]"}`}>
                  AR
                </button>
              </div>
            </div>

            {/* Sign out */}
            {user && (
              <button type="button" onClick={handleLogout}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[1.25rem] border border-[#dde4df] bg-white text-sm font-bold text-[#78837b] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                <FaSignOutAlt />
                {isArabic ? "تسجيل الخروج" : "Sign out"}
              </button>
            )}
          </div>

          {/* Right: recent orders + action grid + policies */}
          <div className="space-y-6">

            {/* Recent orders (logged-in only) */}
            {user && (
              <div className="overflow-hidden rounded-[1.5rem] border border-[#dde4df] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.05)]">
                <div className="flex items-center justify-between border-b border-[#edf0ed] px-6 py-5">
                  <div>
                    <p className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>
                      {isArabic ? "آخر النشاطات" : "Recent activity"}
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold text-[#142019]">
                      {isArabic ? "الطلبات الأخيرة" : "Recent orders"}
                    </h2>
                  </div>
                  <Link href="/orders" className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#dde4df] px-4 text-xs font-extrabold text-[#526057] transition hover:border-[#0a583b] hover:text-[#0a583b]">
                    {isArabic ? "عرض الكل" : "View all"}
                  </Link>
                </div>

                {orders.length > 0 ? (
                  <div className="divide-y divide-[#edf0ed]">
                    {orders.map((order) => {
                      const { label, color } = getStatusLabel(order.status);
                      return (
                        <Link
                          key={order.id}
                          href="/orders"
                          className="group flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#f7fbf8]"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-sm text-[#0a583b]">
                              <FaBoxOpen />
                            </div>
                            <div>
                              <p className="font-extrabold text-[#142019]">
                                {isArabic ? `طلب #${order.id}` : `Order #${order.id}`}
                              </p>
                              <p className="mt-0.5 text-sm text-[#647168]">{formatPrice(order.total_price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${color}`}>{label}</span>
                            <FaChevronRight className="text-xs text-[#c5cfc7] transition group-hover:text-[#0a583b]" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-xl text-[#0a583b]">
                      <FaBoxOpen />
                    </div>
                    <p className="mt-4 font-extrabold text-[#142019]">
                      {isArabic ? "لا توجد طلبات بعد" : "No orders yet"}
                    </p>
                    <p className="mt-1 text-sm text-[#647168]">
                      {isArabic ? "ستظهر طلباتك هنا بعد إتمام أول عملية شراء." : "Your orders will appear here after your first purchase."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action grid (2x2) */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {actionItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-start justify-between rounded-[1.25rem] border border-[#dde4df] bg-white p-5 transition hover:border-[#b8cbbf] hover:shadow-[0_4px_20px_rgba(10,88,59,0.08)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf5f0] text-sm text-[#0a583b] transition group-hover:bg-[#0a583b] group-hover:text-white">
                    {item.icon}
                  </div>
                  <div className="mt-5 flex w-full items-end justify-between gap-1">
                    <span className="text-sm font-extrabold text-[#142019]">
                      {isArabic ? item.labelAr : item.labelEn}
                    </span>
                    {item.badge && <span className="mb-0.5 h-2 w-2 shrink-0 rounded-full bg-[#22a66f]" />}
                  </div>
                </Link>
              ))}
            </div>

            {/* Policies */}
            <div className="overflow-hidden rounded-[1.5rem] border border-[#dde4df] bg-white shadow-[0_8px_30px_rgba(20,32,25,0.05)]">
              <div className="border-b border-[#edf0ed] px-6 py-5">
                <p className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${isArabic ? "tracking-normal" : "tracking-[0.15em]"}`}>
                  {isArabic ? "المساعدة والمعلومات" : "Help & information"}
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-[#142019]">
                  {isArabic ? "السياسات" : "Policies"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPoliciesOpen((o) => !o)}
                aria-expanded={policiesOpen}
                className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-start transition hover:bg-[#f7fbf8]"
              >
                <div>
                  <h3 className="font-extrabold text-[#142019]">
                    {isArabic ? "سياسات ومعلومات الموقع" : "Website policies & information"}
                  </h3>
                  <p className="mt-1 text-sm text-[#647168]">
                    {isArabic ? "الخصوصية، الشروط وسياسة الاسترجاع." : "Privacy, terms, and refund information."}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] text-xs text-[#647168] transition group-hover:border-[#0a583b] group-hover:text-[#0a583b]">
                  <FaChevronDown className={`transition-transform duration-300 ${policiesOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              <div className={`grid transition-all duration-300 ease-in-out ${policiesOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  {[
                    { href: "/privacy-policy", icon: <FaShieldAlt />,    labelAr: "سياسة الخصوصية",   labelEn: "Privacy policy",    descAr: "كيفية استخدام معلوماتك وحماية بياناتك.", descEn: "How your information is used and protected." },
                    { href: "/terms",          icon: <FaFileContract />, labelAr: "الشروط والأحكام",  labelEn: "Terms & conditions", descAr: "شروط استخدام الموقع وإتمام الطلبات.",    descEn: "Website usage and ordering terms." },
                    { href: "/refund-policy",  icon: <FaUndoAlt />,      labelAr: "سياسة الاسترجاع", labelEn: "Refund policy",      descAr: "شروط إعادة المنتجات واسترداد المبلغ.",  descEn: "Product return and refund conditions." },
                  ].map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      className="group flex items-center justify-between gap-4 border-t border-[#edf0ed] px-6 py-4 transition hover:bg-[#f7fbf8]"
                    >
                      <div className="flex items-center gap-4">
                        <span className="shrink-0 text-[#0a583b]">{p.icon}</span>
                        <div>
                          <p className="font-extrabold text-[#142019]">{isArabic ? p.labelAr : p.labelEn}</p>
                          <p className="mt-0.5 text-xs text-[#647168]">{isArabic ? p.descAr : p.descEn}</p>
                        </div>
                      </div>
                      <FaChevronRight className="shrink-0 text-xs text-[#c5cfc7] transition group-hover:text-[#0a583b]" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}