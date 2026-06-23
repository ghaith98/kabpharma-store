"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../../context/LanguageContext";

export default function LoginPage() {
  const { lang } = useLanguage();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fullPhone = phone.trim() ? `963${phone.trim()}` : "";

  function t(en: string, ar: string) {
    return lang === "ar" ? ar : en;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!/^9\d{8}$/.test(phone.trim())) {
      setErrorMessage(
        t(
          "Please enter a valid Syrian mobile number starting with 9.",
          "يرجى إدخال رقم موبايل سوري صحيح يبدأ بالرقم 9."
        )
      );
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("phone", fullPhone)
      .single();

    setLoading(false);

    if (error || !data) {
      setErrorMessage(
        t(
          "Phone number not found. Please create an account first.",
          "رقم الهاتف غير موجود. يرجى إنشاء حساب أولاً."
        )
      );
      return;
    }

    localStorage.setItem(
      "kab_user",
      JSON.stringify({
        full_name: data.full_name,
        phone: data.phone,
      })
    );

    const redirectAfterLogin = localStorage.getItem("redirect_after_login");

    if (redirectAfterLogin) {
      localStorage.removeItem("redirect_after_login");
      window.location.href = redirectAfterLogin;
      return;
    }

    window.location.href = "/profile";
  }

  return (
    <main
      dir="ltr"
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12"
    >
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {t("Sign In", "تسجيل الدخول")}
        </h1>

        <p className="mt-2 text-gray-600">
          {t(
            "Enter your Syrian mobile number.",
            "أدخل رقم الموبايل السوري."
          )}
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-green-600">
            <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-4 font-bold text-gray-800">
              <span>🇸🇾</span>
              <span>+963</span>
            </div>

            <input
              type="tel"
              placeholder="9xxxxxxxx"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                setErrorMessage("");
              }}
              maxLength={9}
              className="min-w-0 flex-1 px-4 py-3 text-black outline-none"
            />
          </div>

          {errorMessage && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? t("Signing in...", "جاري تسجيل الدخول...")
              : t("Sign In", "تسجيل الدخول")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("Don't have an account?", "ليس لديك حساب؟")}{" "}
          <Link href="/signup" className="font-bold text-green-700">
            {t("Create Account", "إنشاء حساب")}
          </Link>
        </p>
      </div>
    </main>
  );
}