"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { migrateGuestCartToUser } from "@/lib/cart";

type Tab = "phone" | "email";

export default function LoginPage() {
  const { lang } = useLanguage();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("phone");

  // ── Phone state (unchanged) ──────────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);

  // ── Email state ───────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  // ── Shared state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendIn, setResendIn] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const fullPhone = phone.trim() ? `963${phone.trim()}` : "";

  const isArabic = lang === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  function t(en: string, ar: string) {
    return isArabic ? ar : en;
  }

  // ── Countdown timer ───────────────────────────────────────────────────────────
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

  // ── OTP input handlers ────────────────────────────────────────────────────────
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

  // ── Phone: send OTP ───────────────────────────────────────────────────────────
  async function sendLoginOtp() {
    setErrorMessage("");

    if (!/^9\d{8}$/.test(phone.trim())) {
      setErrorMessage(t(
        "Please enter a valid Syrian mobile number starting with 9.",
        "يرجى إدخال رقم موبايل سوري صحيح يبدأ بالرقم 9."
      ));
      return;
    }

    setLoading(true);
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

  // ── Phone: verify OTP & login ─────────────────────────────────────────────────
  async function verifyAndLogin() {
    setErrorMessage("");
    if (otpCode.length !== 6) {
      setErrorMessage(t("Please enter your verification code.", "يرجى إدخال رمز التحقق."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: fullPhone, code: otpCode, mode: "login" }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 404) {
          setErrorMessage(t(
            "No account was found for this phone number. Please create an account first.",
            "لا يوجد حساب مرتبط بهذا الرقم. يرجى إنشاء حساب أولاً."
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
        "Could not complete sign in. Please try again.",
        "تعذر إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى."
      ));
    } finally {
      setLoading(false);
    }
  }

  // ── Email: login ──────────────────────────────────────────────────────────────
  async function emailLogin() {
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(t("Please enter your email.", "يرجى إدخال البريد الإلكتروني."));
      return;
    }
    if (!password) {
      setErrorMessage(t("Please enter your password.", "يرجى إدخال كلمة المرور."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/email/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 403 && result.needsVerification) {
          setNeedsVerification(true);
          setErrorMessage(t(
            "Your email is not verified yet. Check your inbox or resend the code.",
            "لم يتم التحقق من بريدك الإلكتروني بعد. تحقق من صندوق الوارد أو أعد إرسال الرمز."
          ));
        } else if (res.status === 429) {
          setErrorMessage(t(
            "Too many attempts. Please try again later.",
            "محاولات كثيرة. يرجى المحاولة لاحقاً."
          ));
        } else {
          setErrorMessage(t(
            "Incorrect email or password.",
            "البريد الإلكتروني أو كلمة المرور غير صحيحة."
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
        "Could not complete sign in. Please try again.",
        "تعذر إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى."
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
    if (!otpSent) await sendLoginOtp();
    else await verifyAndLogin();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    await emailLogin();
  }

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setErrorMessage("");
    setNeedsVerification(false);
    setOtpSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f5f6f3] px-5 py-10 pb-28 text-[#142019] sm:px-6 lg:py-16 md:pb-12"
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
              {t("Your care and orders, all in one place.", "عنايتك وطلباتك، في مكان واحد.")}
            </h2>
          </div>
          <div className="relative space-y-4 border-t border-white/20 pt-7">
            {[
              t("Secure & fast access", "دخول آمن وسريع"),
              t("Track every order", "متابعة جميع الطلبات"),
              t("Save your favourites", "حفظ المنتجات المفضلة"),
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
              {tab === "phone" && (otpSent ? <MessageCircle size={19} /> : <LockKeyhole size={19} />)}
              {tab === "email" && <Mail size={19} />}
            </div>

            <p className={isArabic
              ? "mt-7 text-[11px] font-extrabold uppercase text-[#0a583b]"
              : "mt-7 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]"
            }>
              {t("Welcome back", "أهلاً بعودتك")}
            </p>

            <h1 className={isArabic
              ? "mt-3 text-[34px] font-extrabold leading-[1.25] [font-family:var(--font-arabic)] sm:text-[40px]"
              : "mt-3 text-[40px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[46px]"
            }>
              {t("Sign In", "تسجيل الدخول")}
            </h1>

            {/* Tabs */}
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

            {/* ── Phone tab ──────────────────────────────────────────────────── */}
            {tab === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="mt-6">
                <p className="mb-4 text-sm leading-7 text-[#647168]">
                  {otpSent
                    ? t("Enter the 6-digit code sent to your WhatsApp number.", "أدخل رمز التحقق المرسل إلى رقم واتساب الخاص بك.")
                    : t("Use the Syrian mobile number linked to your account.", "استخدم رقم الموبايل السوري المرتبط بحسابك.")}
                </p>

                <div dir="ltr" className="flex min-h-[56px] overflow-hidden rounded-2xl border border-[#cfd6d1] bg-white transition focus-within:border-[#0a583b] focus-within:ring-4 focus-within:ring-[#e7f0ea]">
                  <div className="flex items-center gap-2 border-r border-[#dfe4e0] bg-[#f6f7f5] px-4 text-sm font-extrabold text-[#26352d]">
                    <span>🇸🇾</span><span>+963</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="9xxxxxxxx"
                    value={phone}
                    disabled={otpSent}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setErrorMessage(""); }}
                    maxLength={9}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="min-w-0 flex-1 bg-transparent px-4 text-base font-bold text-[#142019] outline-none placeholder:text-[#a2aaa4] disabled:bg-[#f6f7f5]"
                  />
                </div>

                {otpSent && (
                  <div className="mt-5 border-t border-[#dfe4e0] pt-5">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <p dir="ltr" className="text-sm font-extrabold text-[#26352d]">
                        {t("Code sent to WhatsApp " + fullPhone, "الرمز أُرسل إلى واتساب " + fullPhone)}
                      </p>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => { setOtpSent(false); setOtpDigits(["", "", "", "", "", ""]); setErrorMessage(""); setResendAttempts(0); setResendIn(0); }}
                        className="shrink-0 text-xs font-extrabold text-[#0a583b] disabled:opacity-50"
                      >
                        {t("Change", "تغيير")}
                      </button>
                    </div>

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
                          className="aspect-square min-w-0 rounded-xl border border-[#cfd6d1] text-center text-xl font-extrabold outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={loading || resendIn > 0}
                        onClick={sendLoginOtp}
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
                  <p role="alert" className="mt-5 border-s-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-7 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#aeb8b1]"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Please wait...", "يرجى الانتظار...")}</span></>
                  ) : (
                    <><span>{otpSent ? t("Verify & Sign In", "تأكيد وتسجيل الدخول") : t("Send Code", "إرسال الرمز")}</span><ArrowIcon size={16} /></>
                  )}
                </button>
              </form>
            )}

            {/* ── Email tab ──────────────────────────────────────────────────── */}
            {tab === "email" && (
              <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                <p className="text-sm leading-7 text-[#647168]">
                  {t("Sign in with your email and password.", "سجّل دخولك باستخدام بريدك الإلكتروني وكلمة المرور.")}
                </p>

                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Email", "البريد الإلكتروني")}</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); setNeedsVerification(false); }}
                    placeholder={t("you@example.com", "you@example.com")}
                    className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-[#26352d]">{t("Password", "كلمة المرور")}</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                      placeholder="••••••••"
                      className="min-h-[56px] w-full rounded-2xl border border-[#cfd6d1] bg-white px-4 pe-12 text-base font-bold text-[#142019] outline-none transition placeholder:text-[#a2aaa4] focus:border-[#0a583b] focus:ring-4 focus:ring-[#e7f0ea]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-4 top-1/2 -translate-y-1/2 text-[#7a857e] transition hover:text-[#142019]"
                      aria-label={showPassword ? t("Hide password", "إخفاء كلمة المرور") : t("Show password", "إظهار كلمة المرور")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                {needsVerification && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-bold text-amber-800">
                      {t("Your email isn't verified yet.", "لم يتم التحقق من بريدك الإلكتروني بعد.")}
                    </p>
                    <Link
                      href="/signup"
                      className="mt-1 inline-block text-xs font-extrabold text-[#0a583b] underline"
                    >
                      {t("Go to signup to resend the code", "اذهب إلى صفحة إنشاء الحساب لإعادة الإرسال")}
                    </Link>
                  </div>
                )}

                {errorMessage && !needsVerification && (
                  <p role="alert" className="border-s-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:cursor-not-allowed disabled:bg-[#aeb8b1]"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span>{t("Please wait...", "يرجى الانتظار...")}</span></>
                  ) : (
                    <><span>{t("Sign In", "تسجيل الدخول")}</span><ArrowIcon size={16} /></>
                  )}
                </button>
              </form>
            )}

            <div className="mt-7 flex items-start gap-3 border-t border-[#dfe4e0] pt-6">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0a583b]" />
              <p className="text-xs leading-6 text-[#7a857e]">
                {t(
                  "Your information is used only to securely access your account.",
                  "تُستخدم معلوماتك فقط للدخول الآمن إلى حسابك."
                )}
              </p>
            </div>

            <p className="mt-7 text-center text-sm text-[#647168] sm:text-start">
              {t("Don't have an account?", "ليس لديك حساب؟")}{" "}
              <Link href="/signup" className="font-extrabold text-[#0a583b] hover:underline">
                {t("Create Account", "إنشاء حساب")}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}