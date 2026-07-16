"use client";

import Link from "next/link";
import { AlertCircle, RotateCcw } from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="flex min-h-[65vh] items-center bg-[#f7f8f6] px-5 py-14 text-[#142019] sm:px-6"
    >
      <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-[#dfe4e0] bg-white p-7 text-center shadow-[0_20px_60px_rgba(20,32,25,0.06)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle size={24} />
        </div>

        <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">
          {isArabic
            ? "تعذّر تحميل هذه الصفحة"
            : "We couldn’t load this page"}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#647168]">
          {isArabic
            ? "حدث خطأ مؤقت. يمكنك المحاولة مرة أخرى دون مغادرة الموقع."
            : "A temporary error occurred. You can try again without leaving the website."}
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={unstable_retry}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
          >
            <RotateCcw size={16} />
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cbd3cd] px-6 text-sm font-extrabold transition hover:border-[#0a583b] hover:text-[#0a583b]"
          >
            {isArabic ? "الصفحة الرئيسية" : "Go home"}
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[10px] text-[#9aa39d]">
            Reference: {error.digest}
          </p>
        )}
      </section>
    </main>
  );
}
