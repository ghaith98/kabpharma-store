"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaFileContract,
  FaFolderOpen,
  FaGlobe,
  FaHeadset,
  FaShieldAlt,
  FaSignOutAlt,
  FaUndoAlt,
  FaUserCircle,
} from "react-icons/fa";

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
    const savedUser = localStorage.getItem("kab_user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(
          savedUser
        ) as KabUser;

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Failed to read saved user:",
          error
        );

        localStorage.removeItem("kab_user");
      }
    }

    setPageReady(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem("kab_user");
    setUser(null);

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  const actionCardClass =
    "group flex min-h-[150px] items-center justify-between gap-5 rounded-[1.5rem] border border-[#e7ebe8] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d3dfd7] hover:shadow-xl hover:shadow-[#073f2c]/[0.06] sm:p-6";

  const actionIconClass =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f0] text-lg text-[#0a583b]";

  const policyLinkClass =
    "group flex items-center justify-between gap-4 rounded-2xl px-4 py-4 transition hover:bg-[#f5f8f6] sm:px-5";

  if (!pageReady) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-[250px] animate-pulse rounded-[2rem] bg-[#f3f5f3]" />
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen overflow-hidden bg-white pb-24"
    >
      <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        {/* Page heading */}
        <header
          className={`mb-7 sm:mb-9 ${
            isArabic
              ? "text-right"
              : "text-left"
          }`}
        >
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic
                ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                : "tracking-[0.18em]"
            }`}
          >
            {isArabic
              ? "إدارة الحساب"
              : "Account center"}
          </p>

          <h1
            className={`mt-2 text-3xl font-extrabold text-[#142019] sm:text-4xl ${
              isArabic
                ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                : "tracking-[-0.03em]"
            }`}
          >
            {isArabic
              ? "حسابي"
              : "My account"}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
            {isArabic
              ? "إدارة بيانات حسابك، متابعة طلباتك والوصول إلى خدمات KAB Pharma."
              : "Manage your account details, track orders, and access KAB Pharma services."}
          </p>
        </header>

        {/* Account card */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#073f2c] via-[#0a583b] to-[#13734e] text-white shadow-xl shadow-[#073f2c]/10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[0.06]" />

          <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-white/[0.05]" />

          <div className="relative flex flex-col gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-4xl backdrop-blur">
                <FaUserCircle />
              </div>

              {user ? (
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-100">
                    {isArabic
                      ? "مرحباً بك"
                      : "Welcome back"}
                  </p>

                  <h2 className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">
                    {user.full_name}
                  </h2>

                  <p
                    dir="ltr"
                    className="mt-2 text-sm font-medium text-green-50/80"
                  >
                    +{user.phone.replace(/^\+/, "")}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-green-100">
                    {isArabic
                      ? "أهلاً بك"
                      : "Welcome"}
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                    {isArabic
                      ? "سجّل دخولك إلى حسابك"
                      : "Sign in to your account"}
                  </h2>

                  <p className="mt-3 max-w-lg text-sm leading-7 text-green-50/80">
                    {isArabic
                      ? "احفظ بياناتك وتابع طلباتك وشارك تقييماتك بسهولة."
                      : "Save your details, track orders, and share product reviews easily."}
                  </p>
                </div>
              )}
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-extrabold text-white transition hover:bg-white hover:text-[#0a583b] active:scale-[0.98]"
              >
                <FaSignOutAlt />

                <span>
                  {isArabic
                    ? "تسجيل الخروج"
                    : "Logout"}
                </span>
              </button>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#edf5f0] active:scale-[0.98]"
                >
                  {isArabic
                    ? "إنشاء حساب"
                    : "Create account"}
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 text-sm font-extrabold text-white transition hover:bg-white hover:text-[#0a583b] active:scale-[0.98]"
                >
                  {isArabic
                    ? "تسجيل الدخول"
                    : "Sign in"}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="py-10 sm:py-12">
          <div className="mb-6">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                  : "tracking-[0.18em]"
              }`}
            >
              {isArabic
                ? "الوصول السريع"
                : "Quick access"}
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#142019] sm:text-3xl">
              {isArabic
                ? "إدارة حسابك"
                : "Manage your account"}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/orders"
              className={actionCardClass}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className={actionIconClass}>
                  <FaBoxOpen />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-[#142019]">
                    {isArabic
                      ? "طلباتي"
                      : "My orders"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#647168]">
                    {isArabic
                      ? "عرض الطلبات السابقة ومتابعة حالة الطلب الحالي."
                      : "View previous orders and track your current order status."}
                  </p>
                </div>
              </div>

              <FaChevronRight
                className={`shrink-0 text-sm text-[#99a29c] transition group-hover:text-[#0a583b] ${
                  isArabic
                    ? "rotate-180"
                    : ""
                }`}
              />
            </Link>

            <Link
              href="/contact"
              className={actionCardClass}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className={actionIconClass}>
                  <FaHeadset />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#142019]">
                      {isArabic
                        ? "تواصل معنا"
                        : "Contact us"}
                    </h3>

                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />

                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1c9b65]" />
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[#647168]">
                    {isArabic
                      ? "تواصل معنا عبر واتساب، إنستغرام، فيسبوك أو البريد."
                      : "Reach us through WhatsApp, Instagram, Facebook, or email."}
                  </p>
                </div>
              </div>

              <FaChevronRight
                className={`shrink-0 text-sm text-[#99a29c] transition group-hover:text-[#0a583b] ${
                  isArabic
                    ? "rotate-180"
                    : ""
                }`}
              />
            </Link>
          </div>
        </section>

        <div className="h-px bg-[#edf0ed]" />

        {/* Language */}
        <section className="py-10 sm:py-12">
          <div className="rounded-[1.5rem] border border-[#e7ebe8] bg-[#f7f8f6] p-5 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className={actionIconClass}>
                  <FaGlobe />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-[#142019]">
                    {isArabic
                      ? "لغة الموقع"
                      : "Website language"}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[#647168]">
                    {isArabic
                      ? "اختر اللغة التي تفضل استخدامها."
                      : "Choose the language you prefer to use."}
                  </p>
                </div>
              </div>

              <div
                dir="ltr"
                className="grid w-full grid-cols-2 gap-2 rounded-full border border-[#dfe4e0] bg-white p-1.5 sm:w-[280px]"
              >
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`min-h-11 rounded-full px-5 text-sm font-extrabold transition ${
                    lang === "en"
                      ? "bg-[#0a583b] text-white shadow-sm"
                      : "text-[#647168] hover:bg-[#edf5f0] hover:text-[#0a583b]"
                  }`}
                >
                  English
                </button>

                <button
                  type="button"
                  onClick={() => setLang("ar")}
                  className={`min-h-11 rounded-full px-5 text-sm font-extrabold transition ${
                    lang === "ar"
                      ? "bg-[#0a583b] text-white shadow-sm"
                      : "text-[#647168] hover:bg-[#edf5f0] hover:text-[#0a583b]"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#edf0ed]" />

        {/* Policies */}
        <section className="py-10 sm:py-12">
          <div className="mb-6">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                  : "tracking-[0.18em]"
              }`}
            >
              {isArabic
                ? "المساعدة والمعلومات"
                : "Help & information"}
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#142019] sm:text-3xl">
              {isArabic
                ? "السياسات والمعلومات"
                : "Policies & information"}
            </h2>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#e7ebe8] bg-white">
            <button
              type="button"
              onClick={() =>
                setPoliciesOpen(
                  (current) => !current
                )
              }
              aria-expanded={policiesOpen}
              aria-controls="profile-policies"
              className="group flex w-full items-center justify-between gap-5 p-5 text-start transition hover:bg-[#f7f8f6] sm:p-6"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className={actionIconClass}>
                  <FaFolderOpen />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold text-[#142019]">
                    {isArabic
                      ? "عرض سياسات الموقع"
                      : "View website policies"}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[#647168]">
                    {isArabic
                      ? "الخصوصية، الشروط وسياسة الاسترجاع."
                      : "Privacy, terms, and refund information."}
                  </p>
                </div>
              </div>

              <FaChevronDown
                className={`shrink-0 text-[#99a29c] transition duration-300 group-hover:text-[#0a583b] ${
                  policiesOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            <div
              id="profile-policies"
              className={`grid transition-all duration-300 ease-in-out ${
                policiesOpen
                  ? "grid-rows-[1fr] border-t border-[#edf0ed]"
                  : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <nav
                  aria-label={
                    isArabic
                      ? "روابط السياسات"
                      : "Policy links"
                  }
                  className="space-y-1 p-3"
                >
                  <Link
                    href="/privacy-policy"
                    className={policyLinkClass}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#0a583b]">
                        <FaShieldAlt />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[#142019]">
                          {isArabic
                            ? "سياسة الخصوصية"
                            : "Privacy policy"}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[#647168]">
                          {isArabic
                            ? "كيفية استخدام وحماية معلوماتك وبياناتك."
                            : "How your information and data are used and protected."}
                        </p>
                      </div>
                    </div>

                    <FaChevronRight
                      className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                        isArabic
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </Link>

                  <Link
                    href="/terms"
                    className={policyLinkClass}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#0a583b]">
                        <FaFileContract />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[#142019]">
                          {isArabic
                            ? "الشروط والأحكام"
                            : "Terms & conditions"}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[#647168]">
                          {isArabic
                            ? "شروط استخدام الموقع وإتمام الطلبات."
                            : "Website usage and ordering terms."}
                        </p>
                      </div>
                    </div>

                    <FaChevronRight
                      className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                        isArabic
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </Link>

                  <Link
                    href="/refund-policy"
                    className={policyLinkClass}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#0a583b]">
                        <FaUndoAlt />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[#142019]">
                          {isArabic
                            ? "سياسة الاسترجاع"
                            : "Refund policy"}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-[#647168]">
                          {isArabic
                            ? "شروط إعادة المنتجات واسترداد المبلغ."
                            : "Product return and refund conditions."}
                        </p>
                      </div>
                    </div>

                    <FaChevronRight
                      className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                        isArabic
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}