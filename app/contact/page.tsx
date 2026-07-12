"use client";

import { useMemo } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaEnvelope,
  FaWhatsapp,
  FaCheckCircle,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

export default function ContactPage() {
  const { lang } = useLanguage();

  const whatsappUrl = useMemo(() => {
    const message =
      lang === "ar"
        ? `مرحباً فريق KAB Pharma 👋
أحتاج مساعدة بخصوص:

`
        : `Hello KAB Pharma team 👋
I need help regarding:

`;

    return `https://wa.me/963958088969?text=${encodeURIComponent(
      message
    )}`;
  }, [lang]);

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12"
    >
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <section className="rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
            <FaWhatsapp />
          </div>

          <h1 className="mt-5 text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "تواصل معنا" : "Contact Us"}
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">
            {lang === "ar"
              ? "فريق خدمة العملاء جاهز لمساعدتك والإجابة عن استفساراتك المتعلقة بالمنتجات والطلبات."
              : "Our customer service team is ready to help with your products, orders, and questions."}
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-green-700">
            <FaCheckCircle />

            <span>
              {lang === "ar"
                ? "جاهزون لاستقبال رسالتك"
                : "Ready to receive your message"}
            </span>
          </div>
        </section>

        <div className="mt-8 grid gap-4">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-3xl bg-green-600 p-6 text-white shadow-md transition hover:-translate-y-1 hover:bg-green-700 hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                <FaWhatsapp />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {lang === "ar"
                    ? "خدمة العملاء عبر واتساب"
                    : "WhatsApp Customer Service"}
                </h2>

                <p className="mt-1 text-sm text-green-50">
                  {lang === "ar"
                    ? "اضغط هنا وابدأ المحادثة مباشرة."
                    : "Tap here to start a conversation."}
                </p>
              </div>
            </div>

            <span
              className={`text-2xl transition group-hover:translate-x-1 ${
                lang === "ar"
                  ? "rotate-180 group-hover:-translate-x-1"
                  : ""
              }`}
            >
              ›
            </span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-xl text-pink-600">
                <FaInstagram />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Instagram
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "تابعنا وأرسل لنا رسالة عبر إنستغرام."
                    : "Follow us and send us a message."}
                </p>
              </div>
            </div>

            <span
              className={`text-xl text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            >
              ›
            </span>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
                <FaFacebookF />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Facebook
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {lang === "ar"
                    ? "تواصل معنا عبر فيسبوك."
                    : "Connect with us on Facebook."}
                </p>
              </div>
            </div>

            <span
              className={`text-xl text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            >
              ›
            </span>
          </a>

          {/* Email */}
          <a
            href="mailto:kabpharma.sy@hotmail.com"
            className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700">
                <FaEnvelope />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  {lang === "ar"
                    ? "البريد الإلكتروني"
                    : "Email"}
                </h2>

                <p
                  dir="ltr"
                  className="mt-1 text-sm text-gray-600"
                >
                  kabpharma.sy@hotmail.com
                </p>
              </div>
            </div>

            <span
              className={`text-xl text-gray-400 transition group-hover:text-green-700 ${
                lang === "ar" ? "rotate-180" : ""
              }`}
            >
              ›
            </span>
          </a>
        </div>
      </div>
    </main>
  );
}