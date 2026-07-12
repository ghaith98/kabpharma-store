"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import {
  FaBoxOpen,
  FaShieldAlt,
  FaFileContract,
  FaChevronRight,
  FaChevronDown,
  FaSignOutAlt,
  FaUserCircle,
  FaGlobe,
  FaHeadset,
  FaFolderOpen,
  FaUndoAlt,
} from "react-icons/fa";

type KabUser = {
  full_name: string;
  phone: string;
};

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();

  const [user, setUser] = useState<KabUser | null>(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  const isArabic = lang === "ar";

  useEffect(() => {
    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser) as KabUser;
      setUser(parsedUser);
    } catch (error) {
      console.error("Failed to read saved user:", error);
      localStorage.removeItem("kab_user");
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("kab_user");
    setUser(null);
    window.dispatchEvent(new Event("cartUpdated"));
  }

  const mainCardClass =
    "group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md";

  const policyLinkClass =
    "group flex items-center justify-between rounded-2xl px-4 py-4 transition hover:bg-green-50";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12"
    >
      <div className="mx-auto max-w-4xl">
        {/* Account section */}
        <section className="mb-8 rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
            <FaUserCircle />
          </div>

          {user ? (
            <>
              <h1 className="break-words text-3xl font-extrabold text-gray-900 md:text-4xl">
                {user.full_name}
              </h1>

              <p dir="ltr" className="mt-3 text-gray-600">
                {user.phone}
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-2xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                <FaSignOutAlt />

                <span>{isArabic ? "تسجيل الخروج" : "Logout"}</span>
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
                {isArabic ? "حسابك" : "Your Account"}
              </h1>

              <p className="mt-3 text-gray-600">
                {isArabic
                  ? "أنشئي حساباً لحفظ بياناتك وتتبع طلباتك."
                  : "Create an account to save your details and track your orders."}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
                >
                  {isArabic ? "إنشاء حساب" : "Create Account"}
                </Link>

                <Link
                  href="/login"
                  className="rounded-2xl border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  {isArabic ? "تسجيل الدخول" : "Sign In"}
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Language section */}
        <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <FaGlobe />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isArabic ? "اللغة" : "Language"}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {isArabic
                  ? "اختر لغة عرض الموقع."
                  : "Choose your website language."}
              </p>
            </div>
          </div>

          <div dir="ltr" className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-2xl px-5 py-3 font-bold transition ${
                lang === "en"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              English
            </button>

            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`rounded-2xl px-5 py-3 font-bold transition ${
                lang === "ar"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              العربية
            </button>
          </div>
        </section>

        {/* Main profile actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Orders */}
          <Link href="/orders" className={mainCardClass}>
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaBoxOpen />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">
                  {isArabic ? "طلباتي" : "My Orders"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {isArabic
                    ? "تابع حالة طلباتك."
                    : "Track your order status."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Link>

          {/* Contact Us */}
          <Link href="/contact" className={mainCardClass}>
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700">
                <FaHeadset />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {isArabic ? "تواصل معنا" : "Contact Us"}
                  </h2>

                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {isArabic
                    ? "واتساب، إنستغرام، فيسبوك والبريد الإلكتروني."
                    : "WhatsApp, Instagram, Facebook, and email."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Link>
        </div>

        {/* Policies and information */}
        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <button
            type="button"
            onClick={() => setPoliciesOpen((current) => !current)}
            aria-expanded={policiesOpen}
            aria-controls="profile-policies"
            className="group flex w-full items-center justify-between p-6 text-start transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaFolderOpen />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isArabic
                    ? "السياسات والمعلومات"
                    : "Policies & Information"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {isArabic
                    ? "اطّلع على سياسات استخدام الموقع والطلبات."
                    : "View our website and order policies."}
                </p>
              </div>
            </div>

            <FaChevronDown
              className={`shrink-0 text-gray-400 transition duration-300 group-hover:text-green-700 ${
                policiesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            id="profile-policies"
            className={`grid transition-all duration-300 ease-in-out ${
              policiesOpen
                ? "grid-rows-[1fr] border-t border-gray-100"
                : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <nav
                aria-label={
                  isArabic ? "روابط السياسات" : "Policy links"
                }
                className="space-y-1 p-3"
              >
                {/* Privacy policy */}
                <Link
                  href="/privacy-policy"
                  className={policyLinkClass}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <FaShieldAlt />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {isArabic
                          ? "سياسة الخصوصية"
                          : "Privacy Policy"}
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {isArabic
                          ? "كيفية التعامل مع معلوماتك وبياناتك."
                          : "How your information and data are handled."}
                      </p>
                    </div>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-sm text-gray-400 transition group-hover:text-green-700 ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                {/* Terms */}
                <Link href="/terms" className={policyLinkClass}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <FaFileContract />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {isArabic
                          ? "الشروط والأحكام"
                          : "Terms & Conditions"}
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {isArabic
                          ? "شروط استخدام الموقع وإتمام الطلبات."
                          : "Website usage and ordering terms."}
                      </p>
                    </div>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-sm text-gray-400 transition group-hover:text-green-700 ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                {/* Refund policy */}
                <Link
                  href="/refund-policy"
                  className={policyLinkClass}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                      <FaUndoAlt />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {isArabic
                          ? "سياسة الاسترجاع"
                          : "Refund Policy"}
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {isArabic
                          ? "شروط الاسترجاع واسترداد المبلغ."
                          : "Return and refund conditions."}
                      </p>
                    </div>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-sm text-gray-400 transition group-hover:text-green-700 ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>
              </nav>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}