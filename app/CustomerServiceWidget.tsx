"use client";

import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaHeadset,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function CustomerServiceWidget() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = useMemo(() => {
    const message =
      lang === "ar"
        ? `مرحباً فريق KAB Pharma 👋
أحتاج مساعدة بخصوص:

`
        : `Hello KAB Pharma team 👋
I need help regarding:

`;

    return `https://wa.me/963958088969?text=${encodeURIComponent(message)}`;
  }, [lang]);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed bottom-24 right-4 z-[80] md:bottom-6 md:right-6"
    >
      {/* Customer service popup */}
      <div
        id="customer-service-popup"
        className={`absolute bottom-20 right-0 w-[calc(100vw-2rem)] max-w-[350px] origin-bottom-right overflow-hidden rounded-[1.75rem] bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible translate-y-4 scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-700 p-5 text-white">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5" />

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={`absolute top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 ${
              lang === "ar" ? "left-4" : "right-4"
            }`}
            aria-label={lang === "ar" ? "إغلاق" : "Close"}
          >
            <FaTimes />
          </button>

          <div className="relative flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl text-green-700 shadow-sm">
              <FaHeadset />

              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-green-700 bg-green-300" />
            </div>

            <div>
              <p className="text-xs font-medium text-green-100">
                {lang === "ar" ? "خدمة العملاء" : "Customer Service"}
              </p>

              <h2 className="mt-0.5 text-lg font-extrabold">
                KAB Pharma
              </h2>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-green-100">
                <FaCheckCircle />
                <span>
                  {lang === "ar"
                    ? "جاهزون لمساعدتك"
                    : "Ready to help you"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="rounded-2xl rounded-tr-md bg-gray-100 p-4">
            <p className="font-bold text-gray-900">
              {lang === "ar"
                ? "أهلاً وسهلاً بكِ 👋"
                : "Welcome to KAB Pharma 👋"}
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {lang === "ar"
                ? "فريق خدمة العملاء جاهز للإجابة عن استفساراتك ومساعدتك في المنتجات والطلبات."
                : "Our customer service team is ready to help with products, orders, and any questions."}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-green-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md"
          >
            <FaWhatsapp className="text-2xl" />

            <span>
              {lang === "ar"
                ? "ابدئي المحادثة عبر واتساب"
                : "Start WhatsApp Chat"}
            </span>
          </a>

          <p className="mt-3 text-center text-xs text-gray-400">
            {lang === "ar"
              ? "سيتم فتح واتساب مع رسالة جاهزة للكتابة"
              : "WhatsApp will open with a ready message"}
          </p>
        </div>
      </div>

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="customer-service-popup"
        aria-label={
          lang === "ar" ? "فتح خدمة العملاء" : "Open customer service"
        }
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white shadow-[0_12px_35px_rgba(22,163,74,0.4)] transition duration-300 hover:-translate-y-1 hover:bg-green-700 hover:shadow-[0_16px_40px_rgba(22,163,74,0.5)]"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-20" />

        <span className="relative">
          {isOpen ? <FaTimes /> : <FaWhatsapp />}
        </span>

        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-extrabold text-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
