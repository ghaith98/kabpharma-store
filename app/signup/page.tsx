"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { migrateGuestCartToUser } from "@/lib/cart";

type Tab = "phone" | "email";

// Common country codes for the phone picker on the email signup form
const COUNTRY_CODES = [
  { flag: "🇸🇾", code: "+963", name: "Syria" },
  { flag: "🇸🇦", code: "+966", name: "Saudi Arabia" },
  { flag: "🇦🇪", code: "+971", name: "UAE" },
  { flag: "🇯🇴", code: "+962", name: "Jordan" },
  { flag: "🇱🇧", code: "+961", name: "Lebanon" },
  { flag: "🇩🇪", code: "+49",  name: "Germany" },
  { flag: "🇬🇧", code: "+44",  name: "UK" },
  { flag: "🇫🇷", code: "+33",  name: "France" },
  { flag: "🇺🇸", code: "+1",   name: "USA" },
  { flag: "🇨🇦", code: "+1",   name: "Canada" },
  { flag: "🇹🇷", code: "+90",  name: "Turkey" },
  { flag: "🇪🇬", code: "+20",  name: "Egypt" },
  { flag: "🇮🇶", code: "+964", name: "Iraq" },
  { flag: "🇰🇼", code: "+965", name: "Kuwait" },
  { flag: "🇧🇭", code: "+973", name: "Bahrain" },
  { flag: "🇶🇦", code: "+974", name: "Qatar" },
  { flag: "🇴🇲", code: "+968", name: "Oman" },
  { flag: "🇸🇪", code: "+46",  name: "Sweden" },
  { flag: "🇳🇱", code: "+31",  name: "Netherlands" },
  { flag: "🇦🇹", code: "+43",  name: "Austria" },
];

export default function SignupPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("phone");

  // ── Phone state (unchanged) ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);

  // ── Email state ───────────────────────────────────────────────────────────────
  const [emailName, setEmailName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [emailPhone, setEmailPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpDigits, setEmailOtpDigits] = useState(["", "", "", "", "", ""]);

  // ── Shared ─────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailOtpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const countryPickerRef = useRef<HTMLDivElement>(null);

  const fullPhone = phone.trim() ? `963${phone.trim()}` : "";
  const isArabic = lang === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  function t(en: string, ar: string) {
    return isArabic ? ar : en;
  }

  // ── Close country picker on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  function cooldownFor(attempt: number) {
    const schedule = [60, 120, 300, 600];
    return schedule[Math.min(Math.max(attempt, 1), schedule.length) - 1];
  }

  const otpCode = otpDigits.join("");
  const emailOtpCode = emailOtpDigits.join("");

  // ── OTP handlers (phone) ──────────────────────────────────────────────────────
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedCode = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;
    e.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, i) => pastedCode[i] || ""));
    inputRefs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
  }

  // ── OTP handlers (email) ──────────────────────────────────────────────────────
  function handleEmailOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const updated = [...emailOtpDigits];
    updated[index] = digit;
    setEmailOtpDigits(updated);
    if (digit && index < 5) emailOtpRefs.current[index + 1]?.focus();
  }

  function handleEmailOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !emailOtpDigits[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  }

  function handleEmailOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedCode = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;
    e.preventDefault();
    setEmailOtpDigits(Array.from({ length: 6 }, (_, i) => pastedCode[i] || ""));
    emailOtpRefs.current[Math.min(pastedCode.length, 6) - 1]?.focus();
  }

  // ── Phone: send OTP ───────────────────────────────────────────────────────────
  async function sendOtp() {
    if (!fullName.trim()) {
      setErrorMessage(t("Please enter your full name.", "يرجى إدخال الاسم الكامل."));
      return;
    }
    if (!/^9\d{8}$/.test(phone.trim())) {
      setErrorMessage(t(
        "Please enter a valid Syrian mobile number starting with 9.",
        "يرجى إدخال رقم موبايل سوري صحيح يبدأ بالرقم 9."
      ));
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 429) {
          const wait = Number(result?.retryAfter) || cooldownFor(resendAttempts || 1);
          setResendIn(wait);
          setErrorMessage(t(
            `Please wait ${wait}s before requesting another code.`,
            `يرجى الانتظار ${wait} ثانية قبل طلب رمز جديد.`
          ));
        } else {
          setErrorMessage(t(
            "Could not send the verification code. Please try again.",
            "تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى."
          ));
        }
        return;
      }

      const nextAttempt = resendAttempts + 1;
      setResendAttempts(nextAttempt);
      setResendIn(cooldownFor(nextAttempt));
      setOtpSent(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setErrorMessage(t(
        "Could not connect to the verification service.",
        "تعذر الاتصال بخدمة التحقق."
      ));
    } finally {
      setLoading(false);
    }
  }

  // ── Phone: verify & create account ────────────────────────────────────────────
  async function createAccountAfterVerify() {
    if (otpCode.length !== 6) {
      setErrorMessage(t("Please enter your verification code.", "يرجى إدخال رمز التحقق."));
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: fullPhone, code: otpCode, mode: "signup", fullName: fullName.trim() }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 409) {
          setErrorMessage(t(
            "An account with this phone number already exists.",
            "يوجد حساب مرتبط بهذا الرقم مسبقاً."
          ));
        } else {
          setErrorMessage(t(
            "Invalid or expired verification code.",
            "رمز التحقق غير صحيح أو منتهي الصلاحية."
          ));
        }
        return;
      }

      localStorage.setItem("kab_user", JSON.stringify({
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
      }));
      migrateGuestCartToUser(result.user.phone);
      redirectAfterAuth();
    } catch {
      setErrorMessage(t(
        "Could not create your account. Please try again.",
        "تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى."
      ));
    } finally {
      setLoading(false);
    }
  }

  // ── Email: send OTP (register) ────────────────────────────────────────────────
  async function sendEmailOtp() {
    setErrorMessage("");

    if (!emailName.trim() || emailName.trim().length < 2) {
      setErrorMessage(t("Please enter your full name.", "يرجى إدخال الاسم الكامل."));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage(t("Please enter a valid email address.", "يرجى إدخال بريد إلكتروني صحيح."));
      return;
    }
    if (!emailPhone.trim() || emailPhone.trim().length < 5) {
      setErrorMessage(t("Please enter your phone number.", "يرجى إدخال رقم الهاتف."));
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage(t("Password must be at least 8 characters.", "كلمة المرور يجب أن تكون 8 أحرف على الأقل."));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t("Passwords do not match.", "كلمتا المرور غير متطابقتين."));
      return;
    }

    setLoading(true);

    try {
      const fullEmailPhone = `${selectedCountry.code}${emailPhone.trim()}`;
      const res = await fetch("/api/customer/auth/email/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: emailName.trim(),
          email: email.trim().toLowerCase(),
          phone: fullEmailPhone,
          password,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 429) {
          const wait = Number(result?.retryAfter) || 60;
          setResendIn(wait);
          setErrorMessage(t(
            `Please wait ${wait}s before requesting another code.`,
            `يرجى الانتظار ${wait} ثانية قبل طلب رمز جديد.`
          ));
        } else if (res.status === 409) {
          setErrorMessage(result.error || t(
            "An account with this email already exists.",
            "يوجد حساب مرتبط بهذا البريد الإلكتروني مسبقاً."
          ));
        } else {
          setErrorMessage(result.error || t(
            "Could not send verification code. Please try again.",
            "تعذر إرسال رمز التحقق. يرجى المحاولة مرة أخرى."
          ));
        }
        return;
      }

      const nextAttempt = resendAttempts + 1;
      setResendAttempts(nextAttempt);
      setResendIn(cooldownFor(nextAttempt));
      setEmailOtpSent(true);
      setTimeout(() => emailOtpRefs.current[0]?.focus(), 100);
    } catch {
      setErrorMessage(t(
        "Could not connect. Please try again.",
        "تعذر الاتصال. يرجى المحاولة مرة أخرى."
      ));
    } finally {
      setLoading(false);
    }
  }

  // ── Email: resend OTP ─────────────────────────────────────────────────────────
  async function resendEmailOtp() {
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/customer/auth/email/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 429) {
          const wait = Number(result?.retryAfter) || 60;
          setResendIn(wait);
          setErrorMessage(t(
            `Please wait ${wait}s before requesting another code.`,
            `يرجى الانتظار ${wait} ثانية قبل طلب رمز جديد.`
          ));
        } else {
          setErrorMessage(t("Could not resend code.", "تعذر إعادة الإرسال."));
        }
        return;
      }

      const nextAttempt = resendAttempts + 1;
      setResendAttempts(nextAttempt);
      setResendIn(cooldownFor(nextAttempt));
    } catch {
      setErrorMessage(t("Could not connect.", "تعذر الاتصال."));
    } finally {
      setLoading(false);
    }
  }

  // ── Email: verify OTP & create account ───────────────────────────────────────
  async function verifyEmailOtp() {
    if (emailOtpCode.length !== 6) {
      setErrorMessage(t("Please enter your verification code.", "يرجى إدخال رمز التحقق."));
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/customer/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: emailOtpCode }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMessage(t(
          "Invalid or expired verification code.",
          "رمز التحقق غير صحيح أو منتهي الصلاحية."
        ));
        return;
      }

      localStorage.setItem("kab_user", JSON.stringify({
        id: result.user.id,
        full_name: result.user.full_name,
        phone: result.user.phone,
      }));
      migrateGuestCartToUser(result.user.phone);
      redirectAfterAuth();
    } catch {
      setErrorMessage(t(
        "Could not complete signup. Please try again.",
        "تعذر إكمال إنشاء الحساب. يرجى المحاولة مرة أخرى."
      ));
    } finally {
      setLoading(false);
    }
  }

  function redirectAfterAuth() {
    const redirectAfterLogin = localStorage.getItem("redirect_after_login");
    if (redirectAfterLogin?.startsWith("/") && !redirectAfterLogin.startsWith("//")) {
      localStorage.removeItem("redirect_after_login");
      router.replace(redirectAfterLogin);
      return;
    }
    localStorage.removeItem("redirect_after_login");
    router.replace("/profile");
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otpSent) await sendOtp();
    else await createAccountAfterVerify();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOtpSent) await sendEmailOtp();
    else await verifyEmailOtp();
  }

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setErrorMessage("");
    setOtpSent(false);
    setEmailOtpSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setEmailOtpDigits(["", "", "", "", "", ""]);
    setResendAttempts(0);
    setResendIn(0);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f5f6f3] px-5 py-10 pb-28 text-[#142019] sm:px-6 md:pb-12 lg:py-16"
    >
      <div className="mx-auto grid max-w-[1120px] overflow-hidden border border-[#dfe4e0] bg-white lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">

        {/* Left panel */}
        <section className="relative hidden overflow-hidden bg-[#0a583b] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/60">KAB Pharma</p>
            <h2 className={isArabic
              ? "mt-8 text-[45px] font-extrabold leading-[1.25] [font-family:var(--font-arabic)]"
              : "mt-8 text-[58px] font-extrabold leading-[0.98] tracking-[-0.055em]"
            }>
              {t("Begin your personal care journey.", "ابدأ رحلة عنايتك الشخصية.")}
            </h2>
          </div>
          <div className="relative space-y-4 border-t border-white/20 pt-7">
            {[
              t("Track every order", "متابعة جميع الطلبات"),
              t("Save your favourites", "حفظ المنتجات المفضلة"),
              t("Secure & fast access", "دخول آمن وسريع"),
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check size={15} />
                <span className="text-sm font-bold text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Right panel */}
        <section className="flex items-center p-6 sm:p-10 lg:p-14 xl:p-20">
          <div className="w-full">

            {/* Icon */}
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f1eb] text-[#0a583b]">
              {tab === "phone" && (otpSent ? <MessageCircle size={19} /> : <UserPlus size={19} />)}
              {tab === "email" && (emailOtpSent ? <MessageCircle size={19} /> : <Mail size={19} />)}
            </div>

            <p className={isArabic
              ? "mt-7 text-[11px] font-extrabold uppercase text-[#0a583b]"
              : "mt-7 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]"
            }>
              {emailOtpSent || otpSent ? t("Verification", "التحقق") : t("Create your account", "إنشاء حسابك")}
            </p>

            <h1 className={isArabic
              ? "mt-3 text-[34px] font-extrabold leading-[1.25] [font-family:var(--font-arabic)] sm:text-[40px]"
              : "mt-3 text-[40px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[46px]"
            }>
              {(otpSent || emailOtpSent)
                ? t("Enter your code.", "أدخل رمز التحقق.")
                : t("Join KAB Pharma.", "انضم إلى KAB Pharma.")}
            </h1>

            {/* Tabs — hide when OTP is showing */}
            {!otpSent && !emailOtpSent && (
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#dfe4e0] bg-[#f5f6f3] p-1.5">
                <button
                  type="button"
                  onClick={() => switchTab("phone")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${
                    tab === "phone"
                      ? "bg-white text-[#0a583b] shadow-sm"
                      : "text-[#647168] hover:text-[#142019]"
                  }`}
                >
                  <Phone size={14} />
                  {t("Phone", "الهاتف")}
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("email")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold transition ${
                    tab === "email"
                      ? "bg-white text-[#0a583b] shadow-sm"
                      : "text-[#647168] hover:text-[#142019]"
                  }`}
                >
                  <Mail size={14} />
                  {t("Email", "البريد الإلكتروني")}
                </button>
              </div>
            )}

            {/* ── Phone tab ──────────────────────────────────────────────────── */}
            {tab === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="mt-6">
                {!otpSent ? (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-[#647168]">
                      {t(
                        "Create your account using your name and Syrian mobile number.",
                        "أنشئ حسابك باستخدام اسمك ورقم الموبايل السوري."
                      )}
                    </p>
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Full name", "الاسم الكامل")}</span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setErrorMessage(""); }}
                        className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        placeholder={t("Enter your full name", "أدخل اسمك الكامل")}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Mobile number", "رقم الموبايل")}</span>
                      <div dir="ltr" className="flex min-h-[56px] overflow-hidden rounded-2xl border border-[#cfd6d1] bg-white transition focus-within:border-[#0a583b] focus-within:ring-4 focus-within:ring-[#e7f0ea]">
                        <div className="flex items-center gap-2 border-r border-[#dfe4e0] bg-[#f6f7f5] px-4 text-sm font-extrabold text-[#26352d]">
                          <span>🇸🇾</span><span>+963</span>
                        </div>
                        <input
                          type="tel"
                          placeholder="9xxxxxxxx"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErrorMessage(""); }}
                          maxLength={9}
                          inputMode="numeric"
                          autoComplete="tel-national"
                          className="min-w-0 flex-1 bg-transparent px-4 text-base font-bold text-[#142019] outline-none placeholder:text-[#a2aaa4]"
                        />
                      </div>
                    </label>
                  </div>
                ) : (
                  <div>
                    <div className="mb-5 flex items-center justify-between gap-4 border-y border-[#dfe4e0] py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#26352d]">{fullName}</p>
                        <p dir="ltr" className="mt-1 text-start text-xs font-bold text-[#7a857e]">+{fullPhone}</p>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => { setOtpSent(false); setOtpDigits(["", "", "", "", "", ""]); setErrorMessage(""); setResendAttempts(0); setResendIn(0); }}
                        className="shrink-0 text-xs font-extrabold text-[#0a583b] disabled:opacity-50"
                      >
                        {t("Edit details", "تعديل البيانات")}
                      </button>
                    </div>

                    <p className="mb-4 text-sm font-bold leading-6 text-[#647168]">
                      {t("Enter the 6-digit code sent to WhatsApp.", "أدخل رمز التحقق المكوّن من 6 أرقام والمرسل إلى واتساب.")}
                    </p>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3" dir="ltr">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          aria-label={t(`Verification digit ${index + 1}`, `رقم التحقق ${index + 1}`)}
                          className="aspect-square min-w-0 rounded-xl border border-[#cfd6d1] text-center text-xl font-extrabold outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={loading || resendIn > 0}
                        onClick={sendOtp}
                        className="text-xs font-extrabold text-[#0a583b] transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendIn > 0
                          ? t(`Resend in ${resendIn}s`, `أعد الإرسال بعد ${resendIn} ثانية`)
                          : t("Resend code", "إعادة إرسال الرمز")}
                      </button>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <p role="alert" className="mt-5 border-s-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#aeb8b1]"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Please wait...", "يرجى الانتظار...")}</span></>
                  ) : (
                    <><span>{otpSent ? t("Create account", "إنشاء الحساب") : t("Sign up", "إنشاء الحساب")}</span><ArrowIcon size={16} /></>
                  )}
                </button>
              </form>
            )}

            {/* ── Email tab ──────────────────────────────────────────────────── */}
            {tab === "email" && (
              <form onSubmit={handleEmailSubmit} className="mt-6">
                {!emailOtpSent ? (
                  <div className="space-y-4">
                    <p className="text-sm leading-7 text-[#647168]">
                      {t(
                        "Create your account with your email and password.",
                        "أنشئ حسابك باستخدام بريدك الإلكتروني وكلمة المرور."
                      )}
                    </p>

                    {/* Full name */}
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Full name", "الاسم الكامل")}</span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={emailName}
                        onChange={(e) => { setEmailName(e.target.value); setErrorMessage(""); }}
                        placeholder={t("Enter your full name", "أدخل اسمك الكامل")}
                        className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                      />
                    </label>

                    {/* Email */}
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Email", "البريد الإلكتروني")}</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                        placeholder="you@example.com"
                        className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                      />
                    </label>

                    {/* Phone with country picker */}
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Phone number", "رقم الهاتف")}</span>
                      <div dir="ltr" className="flex min-h-[56px] overflow-hidden rounded-2xl border border-[#cfd6d1] bg-white transition focus-within:border-[#0a583b] focus-within:ring-4 focus-within:ring-[#e7f0ea]">
                        {/* Country picker button */}
                        <div className="relative" ref={countryPickerRef}>
                          <button
                            type="button"
                            onClick={() => setShowCountryPicker((v) => !v)}
                            className="flex h-full items-center gap-1.5 border-r border-[#dfe4e0] bg-[#f6f7f5] px-3 text-sm font-extrabold text-[#26352d] transition hover:bg-[#edf0ec]"
                          >
                            <span>{selectedCountry.flag}</span>
                            <span>{selectedCountry.code}</span>
                            <ChevronDown size={12} className={`transition-transform ${showCountryPicker ? "rotate-180" : ""}`} />
                          </button>

                          {showCountryPicker && (
                            <div className="absolute start-0 top-full z-50 mt-1 max-h-60 w-52 overflow-y-auto rounded-2xl border border-[#dfe4e0] bg-white shadow-lg">
                              {COUNTRY_CODES.map((country) => (
                                <button
                                  key={`${country.code}-${country.name}`}
                                  type="button"
                                  onClick={() => { setSelectedCountry(country); setShowCountryPicker(false); }}
                                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#f5f6f3] ${
                                    selectedCountry.name === country.name ? "text-[#0a583b]" : "text-[#26352d]"
                                  }`}
                                >
                                  <span>{country.flag}</span>
                                  <span className="flex-1">{country.name}</span>
                                  <span className="text-xs text-[#7a857e]">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <input
                          type="tel"
                          placeholder={t("Phone number", "رقم الهاتف")}
                          value={emailPhone}
                          onChange={(e) => { setEmailPhone(e.target.value.replace(/\D/g, "")); setErrorMessage(""); }}
                          inputMode="numeric"
                          autoComplete="tel-national"
                          className="min-w-0 flex-1 bg-transparent px-4 text-base font-bold text-[#142019] outline-none placeholder:text-[#a2aaa4]"
                        />
                      </div>
                    </label>

                    {/* Password */}
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Password", "كلمة المرور")}</span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                          placeholder="••••••••"
                          className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 pe-12 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute end-4 top-1/2 -translate-y-1/2 text-[#7a857e] transition hover:text-[#142019]"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>

                    {/* Confirm password */}
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Confirm password", "تأكيد كلمة المرور")}</span>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(""); }}
                          placeholder="••••••••"
                          className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 pe-12 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute end-4 top-1/2 -translate-y-1/2 text-[#7a857e] transition hover:text-[#142019]"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>
                  </div>
                ) : (
                  /* OTP step */
                  <div>
                    <div className="mb-5 flex items-center justify-between gap-4 border-y border-[#dfe4e0] py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#26352d]">{emailName}</p>
                        <p className="mt-1 text-xs font-bold text-[#7a857e]">{email}</p>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => { setEmailOtpSent(false); setEmailOtpDigits(["", "", "", "", "", ""]); setErrorMessage(""); setResendAttempts(0); setResendIn(0); }}
                        className="shrink-0 text-xs font-extrabold text-[#0a583b] disabled:opacity-50"
                      >
                        {t("Edit details", "تعديل البيانات")}
                      </button>
                    </div>

                    <p className="mb-4 text-sm font-bold leading-6 text-[#647168]">
                      {t(
                        "Enter the 6-digit code sent to your email.",
                        "أدخل رمز التحقق المكوّن من 6 أرقام المرسل إلى بريدك الإلكتروني."
                      )}
                    </p>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3" dir="ltr">
                      {emailOtpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { emailOtpRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleEmailOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
                          onPaste={handleEmailOtpPaste}
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          aria-label={t(`Verification digit ${index + 1}`, `رقم التحقق ${index + 1}`)}
                          className="aspect-square min-w-0 rounded-xl border border-[#cfd6d1] text-center text-xl font-extrabold outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={loading || resendIn > 0}
                        onClick={resendEmailOtp}
                        className="text-xs font-extrabold text-[#0a583b] transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resendIn > 0
                          ? t(`Resend in ${resendIn}s`, `أعد الإرسال بعد ${resendIn} ثانية`)
                          : t("Resend code", "إعادة إرسال الرمز")}
                      </button>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <p role="alert" className="mt-5 border-s-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#aeb8b1]"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Please wait...", "يرجى الانتظار...")}</span></>
                  ) : (
                    <><span>{emailOtpSent ? t("Create account", "إنشاء الحساب") : t("Continue", "متابعة")}</span><ArrowIcon size={16} /></>
                  )}
                </button>
              </form>
            )}

            <div className="mt-7 flex items-start gap-3 border-t border-[#dfe4e0] pt-6">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0a583b]" />
              <p className="text-xs leading-6 text-[#7a857e]">
                {t(
                  "We use your information only to verify and secure your account.",
                  "نستخدم معلوماتك فقط للتحقق من حسابك وحمايته."
                )}
              </p>
            </div>

            <p className="mt-7 text-center text-sm text-[#647168] sm:text-start">
              {t("Already have an account?", "لديك حساب مسبقاً؟")}{" "}
              <Link href="/login" className="font-extrabold text-[#0a583b] hover:underline">
                {t("Sign in", "تسجيل الدخول")}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}