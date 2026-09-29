"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  UserRound,
  UserRoundPen,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

type AccountUser = {
  full_name: string;
  phone: string;
};

export default function AccountInformationPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const response = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }
          return;
        }

        const result = await response.json();

        if (!cancelled) {
          setUser(
            result.authenticated && result.user
              ? {
                  full_name: result.user.full_name,
                  phone: result.user.phone,
                }
              : null
          );
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, []);

  function displayPhone(phone: string) {
    const normalized = phone.trim();

    return normalized.startsWith("+") ? normalized : `+${normalized}`;
  }

  if (loading) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        aria-busy="true"
        aria-label={
          isArabic
            ? "جاري تحميل معلومات الحساب"
            : "Loading account information"
        }
        className="min-h-[65vh] bg-[#f7f8f6] px-5 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto flex max-w-lg animate-pulse flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-[#e2eae5]" />
          <div className="mt-7 h-8 w-56 rounded-lg bg-[#e2e8e4]" />
          <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-[#e7ebe8]" />
          <div className="mt-8 h-12 w-36 bg-[#dce5df]" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-[65vh] items-center justify-center bg-[#f7f8f6] px-5 py-14 sm:px-6 sm:py-20"
      >
        <section className="w-full max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#075b40]">
            <UserRoundPen className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <h1 className="mt-7 text-2xl font-extrabold tracking-tight text-[#102019] sm:text-[1.75rem]">
            {isArabic ? "تسجيل الدخول مطلوب" : "Sign in required"}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#6f7b73]">
            {isArabic
              ? "يرجى تسجيل الدخول لعرض معلومات حسابك."
              : "Please sign in to view your account information."}
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#075b40] px-9 text-sm font-extrabold text-white transition-colors hover:bg-[#064a35] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#075b40]"
          >
            {isArabic ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-[65vh] bg-[#f7f8f6] px-4 pb-24 pt-8 sm:px-6 sm:py-12 lg:px-8"
    >
      <div className="mx-auto max-w-[920px]">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#526058] transition-colors hover:text-[#075b40]"
        >
          <BackArrow className="h-4 w-4" />
          {isArabic ? "العودة إلى حسابي" : "Back to my account"}
        </Link>

        <header className="mt-7 border-b border-[#dfe4e0] pb-7 sm:pb-9">
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.18em]"
            }`}
          >
            KAB Pharma
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[#142019] sm:text-5xl">
            {isArabic ? "معلومات الحساب" : "Account information"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {isArabic
              ? "اطّلع على البيانات الأساسية المرتبطة بحسابك."
              : "Review the essential information linked to your account."}
          </p>
        </header>

        <section className="mt-8 overflow-hidden rounded-[1.6rem] border border-[#dfe4e0] bg-white">
          <div className="flex items-center gap-4 border-b border-[#e7ebe8] px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#075b40]">
              <UserRound className="h-5 w-5" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-[#78847c]">
                {isArabic ? "الاسم الكامل" : "Full name"}
              </p>
              <p className="mt-1 truncate text-base font-extrabold text-[#142019] sm:text-lg">
                {user.full_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#075b40]">
              <Phone className="h-5 w-5" strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#78847c]">
                {isArabic ? "رقم الهاتف" : "Phone number"}
              </p>
              <p
                dir="ltr"
                className={`mt-1 truncate text-base font-extrabold text-[#142019] sm:text-lg ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {displayPhone(user.phone)}
              </p>
            </div>

            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#edf5f0] px-3 py-1.5 text-[11px] font-extrabold text-[#075b40]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isArabic ? "موثّق" : "Verified"}
            </span>
          </div>
        </section>

        <p className="mt-4 text-xs leading-6 text-[#78847c]">
          {isArabic
            ? "يُستخدم رقم الهاتف الموثّق لتسجيل الدخول وربط طلباتك بحسابك."
            : "Your verified phone number is used to sign in and link your orders to your account."}
        </p>
      </div>
    </main>
  );
}
