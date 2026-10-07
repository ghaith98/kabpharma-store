"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const benefits = [
  {
    id: "favorites",
    image: "/images/membership/favorites.svg",
    en: "Save your favorite products to revisit later.",
    ar: "احفظ منتجاتك المفضلة لتعود إليها لاحقاً.",
  },
  {
    id: "orders",
    image: "/images/membership/orders.svg",
    en: "Follow your orders and revisit past purchases.",
    ar: "تابع طلباتك وارجع إلى مشترياتك السابقة.",
  },
  {
    id: "checkout",
    image: "/images/membership/checkout.svg",
    en: "Save delivery details on this device for easier checkout.",
    ar: "احفظ بيانات التوصيل على جهازك لتجربة طلب أسهل.",
  },
  {
    id: "account",
    image: "/images/membership/account.svg",
    en: "Keep your account details in one place.",
    ar: "بيانات حسابك في مكان واحد، بكل سهولة.",
  },
];

export default function MembershipBenefits() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  // Wait for the verified session so signed-in visitors never see a signup flash.
  const [showBenefits, setShowBenefits] = useState(false);

  useEffect(() => {
    let active = true;
    let request = 0;
    let controller: AbortController | null = null;

    async function checkSession() {
      const currentRequest = ++request;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        let isGuest = response.status === 401;
        if (response.ok) {
          const result = await response.json();
          isGuest = result.authenticated === false;
        }
        if (active && currentRequest === request) setShowBenefits(isGuest);
      } catch {
        // Unknown session: keep the signup promotion hidden.
        if (active && currentRequest === request) setShowBenefits(false);
      }
    }

    function refreshSession() { void checkSession(); }
    function handleStorage(event: StorageEvent) {
      if (event.key === "kab_user" || event.key === null) refreshSession();
    }
    refreshSession();
    window.addEventListener("focus", refreshSession);
    window.addEventListener("pageshow", refreshSession);
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("focus", refreshSession);
      window.removeEventListener("pageshow", refreshSession);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (!showBenefits) return null;

  return (
    <section
      aria-labelledby="membership-benefits-title"
      dir={isArabic ? "rtl" : "ltr"}
      className="overflow-hidden bg-white pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-16 lg:pt-16"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h2 id="membership-benefits-title" className={`max-w-[760px] text-2xl font-extrabold leading-[1.25] text-[#142019] sm:text-3xl lg:text-[34px] ${isArabic ? "[font-family:var(--font-arabic)]" : "tracking-[-0.025em]"}`}>
          {isArabic ? "مزايا أكثر مع حسابك في كاب فارما." : "The benefits of your KAB Pharma account."}
        </h2>
        <p className="mt-4 max-w-[600px] text-[13px] leading-[1.7] text-[#647168] sm:text-sm">
          {isArabic ? "أنشئ حسابك لتحتفظ بمفضلتك وتتابع طلباتك بسهولة." : "Create an account to keep your favorites close and your orders easy to follow."}
        </p>
      </div>

      <div className="kab-membership-viewport mt-7 sm:mt-8" role="region" aria-label={isArabic ? "مزايا الحساب" : "Account benefits"}>
        <div className="kab-membership-track" data-direction={isArabic ? "rtl" : "ltr"} dir="ltr">
          {[0, 1].map((copy) => (
            <div className="kab-membership-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {benefits.map((benefit) => (
                <div key={benefit.id} dir={isArabic ? "rtl" : "ltr"} className="flex min-h-[80px] w-[280px] shrink-0 items-center gap-3 rounded-lg bg-white px-3 py-3 shadow-[0_3px_16px_rgba(20,32,25,0.075)] sm:min-h-[104px] sm:w-[380px] sm:gap-4 sm:px-4 sm:py-4">
                  <Image src={benefit.image} width={72} height={72} alt="" className="h-[58px] w-[58px] shrink-0 rounded-md sm:h-[72px] sm:w-[72px]" />
                  <p className="text-[12px] leading-5 text-[#526058] sm:text-sm sm:leading-6">{isArabic ? benefit.ar : benefit.en}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-7 flex max-w-[1440px] flex-col items-center gap-2 px-4 sm:mt-8 sm:px-6 lg:px-8">
        <Link href="/signup" className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#142019] bg-white px-6 py-2.5 text-sm font-medium text-[#142019] transition hover:bg-[#142019] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b] focus-visible:ring-offset-4 sm:max-w-[340px]">
          {isArabic ? "إنشاء حسابي" : "Create My Account"}
        </Link>
        <Link href="/login" className="text-center text-xs leading-6 text-[#647168] underline underline-offset-2 transition hover:text-[#0a583b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b] sm:text-[13px]"style={{
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  textDecorationThickness: "1px",
}}>
          {isArabic ? "لديك حساب بالفعل؟ تسجيل الدخول" : "Already have an account? Log in"}
        </Link>
      </div>
    </section>
  );
}
