"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useLanguage } from "../../context/LanguageContext";

export default function LoginPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const fullPhone = phone.trim() ? `963${phone.trim()}` : "";
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

 async function sendLoginOtp() {
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

  try {
    const response = await fetch(
      "/api/send-otp",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          phone: fullPhone,
        }),
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      setErrorMessage(
        t(
          "Could not send the verification code. Please try again.",
          "تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى."
        )
      );

      return;
    }

    setOtpSent(true);

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  } catch {
    setErrorMessage(
      t(
        "Could not connect to the verification service.",
        "تعذر الاتصال بخدمة التحقق."
      )
    );
  } finally {
    setLoading(false);
  }
}

  async function verifyAndLogin() {
  setErrorMessage("");

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

  try {
    const response = await fetch(
      "/api/verify-otp",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          phone: fullPhone,
          code: otpCode,
          mode: "login",
        }),
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      if (response.status === 404) {
        setErrorMessage(
          t(
            "No account was found for this phone number. Please create an account first.",
            "لا يوجد حساب مرتبط بهذا الرقم. يرجى إنشاء حساب أولاً."
          )
        );
      } else {
        setErrorMessage(
          t(
            "Invalid or expired verification code.",
            "رمز التحقق غير صحيح أو منتهي الصلاحية."
          )
        );
      }

      return;
    }

    /*
      مؤقتاً للمحافظة على توافق
      Profile وOrders القديمة.
      الصلاحيات الآمنة تعتمد على Cookie.
    */
    localStorage.setItem(
      "kab_user",
      JSON.stringify({
        id: result.user.id,
        full_name:
          result.user.full_name,
        phone: result.user.phone,
      })
    );

    const redirectAfterLogin =
      localStorage.getItem(
        "redirect_after_login"
      );

    if (
      redirectAfterLogin?.startsWith("/") &&
      !redirectAfterLogin.startsWith("//")
    ) {
      localStorage.removeItem(
        "redirect_after_login"
      );

      router.replace(redirectAfterLogin);

      return;
    }

    localStorage.removeItem(
      "redirect_after_login"
    );
    router.replace("/profile");
  } catch {
    setErrorMessage(
      t(
        "Could not complete sign in. Please try again.",
        "تعذر إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى."
      )
    );
  } finally {
    setLoading(false);
  }
}

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!otpSent) {
      await sendLoginOtp();
      return;
    }

    await verifyAndLogin();
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
          {t("Enter your Syrian mobile number.", "أدخل رقم الموبايل السوري.")}
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
                ? t("Verify & Sign In", "تأكيد وتسجيل الدخول")
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
