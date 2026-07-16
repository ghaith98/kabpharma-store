"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="flex min-h-[65vh] items-center bg-[#f7f8f6] px-5 py-14 text-[#142019] sm:px-6"
    >
      <section className="mx-auto w-full max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#dfe4e0] bg-white text-[#0a583b]">
          <Search size={22} />
        </div>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
          404
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
          {isArabic
            ? "الصفحة غير موجودة"
            : "Page not found"}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#647168] sm:text-base">
          {isArabic
            ? "قد يكون الرابط غير صحيح أو أن الصفحة لم تعد متاحة."
            : "The link may be incorrect, or the page may no longer be available."}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
          >
            {isArabic ? "تصفّح المنتجات" : "Browse products"}
            <ArrowIcon
              size={16}
              className={isArabic ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}
            />
          </Link>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cbd3cd] px-6 text-sm font-extrabold transition hover:border-[#0a583b] hover:text-[#0a583b]"
          >
            {isArabic ? "الصفحة الرئيسية" : "Go home"}
          </Link>
        </div>
      </section>
    </main>
  );
}
