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

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<KabUser | null>(null);
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
          JSON.stringify({
            id: result.user.id,
            ...verifiedUser,
          })
        );

        if (!cancelled) {
          setUser(verifiedUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setPageReady(true);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
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
      setUser(null);

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
    "group flex min-h-[94px] items-center justify-between gap-3 rounded-[1.6rem] border border-[#d8dfda] bg-white px-5 py-4 text-start transition duration-200 active:scale-[0.985] active:border-[#0b5d41] active:bg-[#f4f8f5]";

  const desktopTileClass =
    "group flex min-h-[148px] flex-col justify-between rounded-[1.65rem] border border-[#dde4df] bg-white p-6 text-start transition duration-300 hover:-translate-y-1 hover:border-[#aac2b4] hover:shadow-[0_18px_45px_rgba(11,66,46,0.09)]";

  const mobilePolicyClass =
    "group flex min-h-[64px] items-center justify-between gap-4 border-t border-[#e8ece9] px-5 py-3.5 transition active:bg-[#f3f6f4]";

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
      className={`min-h-screen bg-[#f4f5f1] pb-20 text-[#17221b] ${
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

        <div className="border-b-[10px] border-[#eceee9] bg-white px-4 pb-5 pt-5">
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

            <Link
              href="/products"
              className="group mt-5 flex min-h-[76px] items-center justify-between gap-4 rounded-[1.05rem] bg-[#20231f] px-5 py-4 text-white shadow-[0_12px_24px_rgba(18,26,21,0.12)]"
            >
              <div>
                <p className="text-[15px] font-extrabold leading-5">
                  {isArabic
                    ? "اختاري العناية المناسبة لاحتياجاتك"
                    : "Find care made for your needs"}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {isArabic
                    ? "تصفحي المنتجات حسب احتياج بشرتك"
                    : "Shop products by skin concern"}
                </p>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm text-white transition group-active:bg-white/15">
                <FaChevronRight className={arrowClass} />
              </span>
            </Link>
          </div>
        </div>

        <section className="border-b-[10px] border-[#eceee9] bg-white px-4 py-6">
          <div className="mx-auto max-w-md">
            <h2 className="mb-4 text-xl font-extrabold">
              {isArabic ? "مركز الحساب" : "Account center"}
            </h2>

            <nav
              aria-label={isArabic ? "روابط الحساب" : "Account links"}
              className="grid grid-cols-2 gap-3"
            >
              <Link href="/orders" className={mobileTileClass}>
                <div>
                  <FaBoxOpen className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "الطلبات" : "Orders"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link href="/contact" className={mobileTileClass}>
                <div>
                  <FaHeadset className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "تواصل معنا" : "Contact us"}
                  </span>
                  <p className="mt-1 text-[11px] font-bold text-[#36a369]">
                    {isArabic ? "نحن هنا للمساعدة" : "We’re here to help"}
                  </p>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link href="/wishlist" className={mobileTileClass}>
                <div>
                  <FaHeart className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "قائمتي" : "Wishlist"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <Link
                href="/account-information"
                className={mobileTileClass}
              >
                <div>
                  <FaUserEdit className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "معلومات الحساب" : "Account details"}
                  </span>
                </div>
                <FaChevronRight
                  className={`${arrowClass} shrink-0 text-xs text-[#8d9790] transition group-active:text-[#155b38]`}
                />
              </Link>

              <div className={mobileTileClass}>
                <div>
                  <FaGlobe className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "اللغة" : "Language"}
                  </span>
                  <p dir="ltr" className="mt-1 text-xs text-[#68736c]">
                    EN | AR
                  </p>
                </div>

                <div
                  dir="ltr"
                  className="flex rounded-full bg-[#edf1ee] p-1"
                >
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    aria-pressed={lang === "en"}
                    className={`flex h-8 min-w-10 items-center justify-center rounded-full px-2 text-[10px] font-extrabold transition ${
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
                    className={`flex h-8 min-w-10 items-center justify-center rounded-full px-2 text-[10px] font-extrabold transition ${
                      lang === "ar"
                        ? "bg-[#155b38] text-white"
                        : "text-[#68736c]"
                    }`}
                  >
                    AR
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPoliciesOpen((current) => !current)}
                aria-expanded={policiesOpen}
                aria-controls="mobile-profile-policies"
                className={mobileTileClass}
              >
                <div>
                  <FaFileContract className="mb-3 text-xl text-[#155b38]" />
                  <span className="text-[15px] font-extrabold">
                    {isArabic ? "السياسات" : "Policies"}
                  </span>
                </div>
                <FaChevronDown
                  className={`shrink-0 text-xs text-[#8d9790] transition-transform duration-300 ${
                    policiesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
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
                  {user ? profileInitial : <FaUserCircle />}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white/60">
                    {user
                      ? isArabic
                        ? "تم تسجيل الدخول باسم"
                        : "Signed in as"
                      : isArabic
                        ? "مرحباً بك"
                        : "Welcome"}
                  </p>
                  <h1 className="mt-1 truncate text-4xl font-extrabold tracking-[-0.035em]">
                    {user
                      ? user.full_name
                      : isArabic
                        ? "حساب KAB الخاص بك"
                        : "Your KAB account"}
                  </h1>
                  <p
                    dir={user ? "ltr" : undefined}
                    className={`mt-2 text-sm text-white/60 ${
                      user && isArabic ? "text-right" : ""
                    }`}
                  >
                    {user
                      ? `+${user.phone.replace(/^\+/, "")}`
                      : isArabic
                        ? "كل ما تحتاجه للطلبات والمفضلة في مكان واحد."
                        : "Orders, favorites, and support in one place."}
                  </p>
                </div>
              </div>
            </div>

            {user ? (
              <div className="flex flex-col items-end gap-4">
                <Link
                  href="/account-information"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#155b38] transition hover:bg-[#f0f5f1]"
                >
                  <FaUserEdit />
                  {isArabic ? "تعديل الحساب" : "Edit account"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"
                >
                  <FaSignOutAlt />
                  {isArabic ? "تسجيل الخروج" : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
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
            )}
          </div>
        </section>

        <div className="mt-7 grid grid-cols-[minmax(0,1fr)_330px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[2rem] border border-[#e0e5e1] bg-[#fafbf9] p-7 xl:p-9">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#155b38] ${
                    isArabic ? "tracking-normal" : "tracking-[0.18em]"
                  }`}
                >
                  {isArabic ? "إدارة حسابك" : "Manage your account"}
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">
                  {isArabic ? "كل شيء في مكان واحد" : "Everything in one place"}
                </h2>
              </div>
            </div>

            <nav
              aria-label={isArabic ? "روابط الحساب" : "Account links"}
              className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-3"
            >
              <Link href="/orders" className={desktopTileClass}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaBoxOpen />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
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
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaHeart />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
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

              <Link
                href="/account-information"
                className={desktopTileClass}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaUserEdit />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
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

              <Link href="/contact" className={desktopTileClass}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaHeadset />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {isArabic ? "تواصل معنا" : "Contact us"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#36a369]">
                      {isArabic
                        ? "فريقنا جاهز لمساعدتك."
                        : "Our team is ready to help."}
                    </p>
                  </div>
                  <FaChevronRight
                    className={`${arrowClass} shrink-0 text-xs text-[#95a098] transition group-hover:text-[#155b38]`}
                  />
                </div>
              </Link>

              <Link href="/products" className={desktopTileClass}>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaShieldAlt />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {isArabic ? "تسوّق حسب الاحتياج" : "Shop by need"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#68736c]">
                      {isArabic
                        ? "اكتشف عناية تناسب بشرتك."
                        : "Find care suited to your skin."}
                    </p>
                  </div>
                  <FaChevronRight
                    className={`${arrowClass} shrink-0 text-xs text-[#95a098] transition group-hover:text-[#155b38]`}
                  />
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setPoliciesOpen((current) => !current)}
                aria-expanded={policiesOpen}
                aria-controls="desktop-profile-policies"
                className={desktopTileClass}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaFileContract />
                </div>
                <div className="mt-5 flex w-full items-end justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold">
                      {isArabic ? "السياسات" : "Policies"}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#68736c]">
                      {isArabic
                        ? "الخصوصية والشروط والاسترجاع."
                        : "Privacy, terms, and returns."}
                    </p>
                  </div>
                  <FaChevronDown
                    className={`shrink-0 text-xs text-[#95a098] transition-transform duration-300 ${
                      policiesOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            </nav>

            <div
              id="desktop-profile-policies"
              className={`grid transition-all duration-300 ease-in-out ${
                policiesOpen
                  ? "mt-4 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <nav className="grid grid-cols-3 gap-3 rounded-[1.4rem] border border-[#dce3de] bg-white p-3">
                  <Link
                    href="/privacy-policy"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "سياسة الخصوصية" : "Privacy policy"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link
                    href="/terms"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "الشروط والأحكام" : "Terms & conditions"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                  <Link
                    href="/refund-policy"
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition hover:bg-[#f1f5f2]"
                  >
                    <span>{isArabic ? "سياسة الاسترجاع" : "Refund policy"}</span>
                    <FaChevronRight
                      className={`${arrowClass} text-[10px] text-[#8d9790]`}
                    />
                  </Link>
                </nav>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] bg-[#20231f] p-7 text-white shadow-[0_20px_50px_rgba(22,29,24,0.12)]">
              <p
                className={`text-[10px] font-extrabold uppercase text-[#a9cc75] ${
                  isArabic ? "tracking-normal" : "tracking-[0.18em]"
                }`}
              >
                {isArabic ? "اختيار أسهل" : "Made for you"}
              </p>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight">
                {isArabic
                  ? "ابحث عن العناية المناسبة لاحتياجاتك"
                  : "Find care that fits your needs"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                {isArabic
                  ? "تصفّح مجموعات مختارة حسب احتياج بشرتك وشعرك."
                  : "Explore curated products by skin and hair concern."}
              </p>
              <Link
                href="/products"
                className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-full bg-white px-5 text-sm font-extrabold text-[#20231f] transition hover:bg-[#edf2ed]"
              >
                {isArabic ? "اكتشف الآن" : "Explore now"}
                <FaChevronRight className={arrowClass} />
              </Link>
            </section>

            <section className="rounded-[2rem] border border-[#dfe5e1] bg-white p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ed] text-[#155b38]">
                  <FaGlobe />
                </div>
                <div>
                  <h2 className="font-extrabold">
                    {isArabic ? "اللغة" : "Language"}
                  </h2>
                  <p className="mt-0.5 text-xs text-[#68736c]">
                    {isArabic ? "اختر لغة الموقع" : "Choose your site language"}
                  </p>
                </div>
              </div>

              <div dir="ltr" className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  aria-pressed={lang === "en"}
                  className={`min-h-11 rounded-full text-xs font-extrabold transition ${
                    lang === "en"
                      ? "bg-[#155b38] text-white"
                      : "bg-[#edf1ee] text-[#59665e] hover:bg-[#e3e9e5]"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang("ar")}
                  aria-pressed={lang === "ar"}
                  className={`min-h-11 rounded-full text-xs font-extrabold transition ${
                    lang === "ar"
                      ? "bg-[#155b38] text-white"
                      : "bg-[#edf1ee] text-[#59665e] hover:bg-[#e3e9e5]"
                  }`}
                >
                  العربية
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}