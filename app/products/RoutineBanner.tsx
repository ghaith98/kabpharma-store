"use client";

import { Sparkles } from "lucide-react";

import KABAssistantWidget from "../KABAssistantWidget";
import { useLanguage } from "../../context/LanguageContext";

export default function RoutineBanner() {
  const { lang } = useLanguage();
  const isAr = lang === "ar";
  const t = (en: string, ar: string) =>
    isAr ? ar : en;

  return (
    <section
      dir="ltr"
      className="relative col-span-full min-h-[158px] overflow-hidden rounded-[1.45rem] bg-[#d8efff] text-left text-[#102942] shadow-[0_22px_45px_-34px_rgba(12,77,121,.45)] sm:min-h-[260px] sm:rounded-[1.9rem]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/kab-skin-consultation-hero.png')",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#eaf7ff]/98 via-[#eaf7ff]/94 to-transparent"
      />

      <div className="relative z-10 flex min-h-[158px] max-w-[62%] flex-col justify-center px-5 py-5 text-left sm:min-h-[260px] sm:max-w-[55%] sm:px-10 sm:py-7 lg:px-14">
        <span className="inline-flex w-fit items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[.16em] text-[#15547f] sm:text-[10px]">
          <Sparkles className="h-3.5 w-3.5" />
          {t(
            "KAB SMART CONSULTATION",
            "استشارة KAB الذكية"
          )}
        </span>

        <h2 className="mt-3 max-w-md text-xl font-extrabold leading-[1.1] tracking-[-.035em] sm:mt-4 sm:text-3xl">
          {t(
            "Your routine, considered.",
            "روتين مدروس يناسبك."
          )}
        </h2>

        <p className="mt-2 max-w-sm text-[11px] leading-5 text-[#183c58]/80 sm:mt-3 sm:text-sm sm:leading-6">
          {t(
            "Answer a few thoughtful questions and receive a focused KAB routine.",
            "أجيبي عن أسئلة مدروسة واحصلي على روتين KAB مركّز لك."
          )}
        </p>

        <KABAssistantWidget placement="banner" />
      </div>
    </section>
  );
}
