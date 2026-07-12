"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import {
  FaBoxOpen,
  FaShieldAlt,
  FaFileContract,
  FaFacebookF,
  FaInstagram,
  FaChevronRight,
  FaSignOutAlt,
  FaUserCircle,
  FaGlobe,
  FaWhatsapp,
} from "react-icons/fa";

type KabUser = {
  full_name: string;
  phone: string;
};

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<KabUser | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("kab_user");

    if (!savedUser) return;

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error("Failed to read saved user:", error);
      localStorage.removeItem("kab_user");
    }
  }, []);

  const whatsappUrl = useMemo(() => {
    const message =
      lang === "ar"
        ? `مرحباً فريق KAB Pharma 👋
أحتاج مساعدة بخصوص:

`
        : `Hello KAB Pharma team 👋
I need help regarding:

`;

    return `https://wa.me/963958088969?text=${encodeURIComponent(message)}`;
  }, [lang]);

  function handleLogout() {
    localStorage.removeItem("kab_user");
    setUser(null);
    window.dispatchEvent(new Event("cartUpdated"));
  }

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
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
              <h1 className="text-4xl font-extrabold text-gray-900">
                {user.full_name}
              </h1>

              <p className="mt-3 text-gray-600">{user.phone}</p>

              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-2xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <FaSignOutAlt />

                {lang === "ar" ? "تسجيل الخروج" : "Logout"}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-extrabold text-gray-900">
                {lang === "ar" ? "حسابك" : "Your Account"}
              </h1>

              <p className="mt-3 text-gray-600">
                {lang === "ar"
                  ? "أنشئي حساباً لحفظ بياناتك وتتبع طلباتك."
                  : "Create an account to save your details and track your orders."}
              </p>

              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
                >
                  {lang === "ar" ? "إنشاء حساب" : "Create Account"}
                </Link>

                <Link
                  href="/login"
                  className="rounded-2xl border border-gray-300 px-6 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
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
                {lang === "ar" ? "اللغة" : "Language"}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {lang === "ar"
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

        {/* Profile links */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Orders */}
          <Link
            href="/orders"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaBoxOpen />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {lang === "ar" ? "طلباتي" : "My Orders"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "تابع حالة طلباتك."
                    : "Track your order status."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            />
          </Link>

          {/* WhatsApp customer service */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700">
                <FaWhatsapp />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {lang === "ar" ? "خدمة العملاء" : "Customer Service"}
                  </h2>

                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "تواصل معنا مباشرة عبر واتساب."
                    : "Contact us directly through WhatsApp."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            />
          </a>

          {/* Privacy policy */}
          <Link
            href="/privacy-policy"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaShieldAlt />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "كيف يتم التعامل مع معلوماتك."
                    : "How your information is handled."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            />
          </Link>

          {/* Terms */}
          <Link
            href="/terms"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <FaFileContract />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "شروط استخدام الموقع والطلبات."
                    : "Website and order terms."}
                </p>
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            />
          </Link>
        </div>

        {/* Social media */}
        <section className="mt-8 rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {lang === "ar" ? "تابعوا KAB Pharma" : "Follow KAB Pharma"}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {lang === "ar"
              ? "تابعوا آخر المنتجات والعروض."
              : "Follow our latest products and offers."}
          </p>

          <div className="mt-5 flex justify-center gap-4">
            <a
              href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:-translate-y-1 hover:border-green-600 hover:text-green-700"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:-translate-y-1 hover:border-green-600 hover:text-green-700"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-xl text-gray-700 transition hover:-translate-y-1 hover:border-green-600 hover:text-green-700"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}