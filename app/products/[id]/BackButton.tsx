"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";

export default function BackButton() {
  const router = useRouter();
  const { lang } = useLanguage();

  function handleBack() {
  const referrer = document.referrer;

  const cameFromExternalWebsite =
    referrer !== "" &&
    new URL(referrer).origin !== window.location.origin;

  if (
    window.history.length > 1 &&
    !cameFromExternalWebsite
  ) {
    router.back();
    return;
  }

  // إذا انفتح المنتج مباشرة أو من موقع خارجي
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