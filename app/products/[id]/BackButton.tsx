"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";

export default function BackButton() {
  const router = useRouter();
  const { lang } = useLanguage();

  function handleBack() {
    const hasPreviousPage =
      window.history.length > 1 &&
      document.referrer !== "";

    if (hasPreviousPage) {
      router.back();
      return;
    }

    /*
      إذا المنتج انفتح مباشرة من رابط Share
      وما في صفحة سابقة، منرجع لصفحة المنتجات.
    */
    router.push("/products");
  }

  const BackIcon =
    lang === "ar" ? FiArrowRight : FiArrowLeft;

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={lang === "ar" ? "رجوع" : "Back"}
      className="relative z-10 inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-700 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700 active:scale-95"
    >
      <BackIcon className="text-lg" />

      <span>{lang === "ar" ? "رجوع" : "Back"}</span>
    </button>
  );
}