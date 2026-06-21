"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../../context/LanguageContext";

export default function SignupPage() {
  const { lang } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const fullPhone = phone.trim() ? `+963${phone.trim()}` : "";
  const otpCode = otpDigits.join("");

  function t(en: string, ar: string) {
    return lang === "ar" ? ar : en;
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);

    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function sendOtp() {
    if (!fullName.trim()) {
      setErrorMessage(t("Please enter your full name.", "يرجى إدخال الاسم الكامل."));
      return;
    }

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
    setErrorMessage("");

    const res = await fetch(`${window.location.origin}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: fullPhone }),
    });

    setLoading(false);

    if (!res.ok) {
      setErrorMessage(
        t(
          "Could not send the verification code. Please try again.",
          "تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى."
        )
      );
      return;
    }

    setOtpSent(true);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  async function createAccountAfterVerify() {
    if (otpCode.length !== 6) {
      setErrorMessage(
        t(
          "Please enter your verification code.",
          "يرجى إدخال رمز التحقق."
        )
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const verifyRes = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: fullPhone,
        code: otpCode,
      }),
    });

    if (!verifyRes.ok) {
      setLoading(false);
      setErrorMessage(
        t(
          "Invalid or expired verification code.",
          "رمز التحقق غير صحيح أو منتهي الصلاحية."
        )
      );
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      full_name: fullName.trim(),
      phone: fullPhone,
    });

    setLoading(false);

    if (error) {
      if (
        error.message.includes("duplicate key") ||
        error.message.includes("profiles_phone_key")
      ) {
        setErrorMessage(
          t(
            "This phone number is already registered.",
            "رقم الهاتف هذا مسجل مسبقاً."
          )
        );
      } else {
        setErrorMessage(error.message);
      }

      return;
    }

    localStorage.setItem(
      "kab_user",
      JSON.stringify({
        full_name: fullName.trim(),
        phone: fullPhone,
      })
    );

    window.location.href = "/profile";
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!otpSent) {
      await sendOtp();
      return;
    }

    await createAccountAfterVerify();
  }

  return (
    <main
      dir="ltr"
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12"
    >
      <div className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {t("Create Account", "إنشاء حساب")}
        </h1>

        <p className="mt-2 text-gray-600">
          {t(
            "Sign up using your Syrian mobile number.",
            "سجّل باستخدام رقم الموبايل السوري."
          )}
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder={t("Full name", "الاسم الكامل")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={otpSent}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-black outline-none focus:border-green-600 disabled:bg-gray-100"
          />

          <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-green-600">
            <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-4 font-bold text-gray-800">
              <span>🇸🇾</span>
              <span>+963</span>
            </div>

            <input
              type="tel"
              placeholder="9xxxxxxxx"
              value={phone}
              disabled={otpSent}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ""));
                setErrorMessage("");
              }}
              maxLength={9}
              className="min-w-0 flex-1 px-4 py-3 text-black outline-none disabled:bg-gray-100"
            />
          </div>

          {otpSent && (
            <div className="rounded-2xl bg-green-50 p-4 text-center">
              <p className="mb-4 text-sm font-bold text-green-800">
                {t(
                  `Enter the 6-digit code sent to WhatsApp ${fullPhone}`,
                  `أدخل رمز التحقق المرسل إلى واتساب ${fullPhone}`
                )}
              </p>

              <div className="flex justify-center gap-2" dir="ltr">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="h-12 w-11 rounded-xl border border-gray-300 text-center text-xl font-extrabold text-gray-900 outline-none focus:border-green-600"
                  />
                ))}
              </div>
            </div>
          )}

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
              ? t("Please wait...", "يرجى الانتظار...")
              : otpSent
                ? t("Create Account", "إنشاء الحساب")
                : t("Create Account", "إنشاء الحساب")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t("Already have an account?", "لديك حساب مسبقاً؟")}{" "}
          <Link href="/login" className="font-bold text-green-700">
            {t("Sign in", "تسجيل الدخول")}
          </Link>
        </p>
      </div>
    </main>
  );
}