"use client";

import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaHeadset,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  const t = {
    en: {
      slogan: "THE QUALITY FOR A HEALTHIER LIFE",
      contact: "Contact Us",
      contactDescription: "Our customer service team is ready to help.",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      rights: "© 2026 KAB Pharma. All rights reserved.",
    },
    ar: {
      slogan: "الجودة لحياة أكثر صحة",
      contact: "تواصل معنا",
      contactDescription: "فريق خدمة العملاء جاهز لمساعدتك.",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      rights: "© 2026 KAB Pharma. جميع الحقوق محفوظة.",
    },
  }[lang as "en" | "ar"];

  return (
    <footer
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="mt-auto border-t border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 text-center">
        <h3 className="text-xl font-bold text-green-700">
          KAB Pharma
        </h3>

        <p className="mt-3 text-gray-600">{t.slogan}</p>

        {/* Contact customer service */}
        <div className="mt-7 flex justify-center">
          <Link
            href="/contact"
            className="group flex w-full max-w-sm items-center justify-between rounded-2xl bg-white px-5 py-4 text-start shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-lg text-green-700 transition group-hover:bg-green-600 group-hover:text-white">
                <FaHeadset />
              </div>

              <div>
                <p className="font-bold text-gray-900">
                  {t.contact}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {t.contactDescription}
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
          </Link>
        </div>

        {/* Social media */}
        <div className="mt-7 flex justify-center gap-4">
          <a
            href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:-translate-y-0.5 hover:border-green-600 hover:text-green-700"
          >
            <FaFacebookF size={20} />
          </a>

          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:-translate-y-0.5 hover:border-green-600 hover:text-green-700"
          >
            <FaInstagram size={20} />
          </a>
        </div>

        {/* Legal links */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium">
          <Link
            href="/contact"
            className="text-gray-600 transition hover:text-green-700"
          >
            {t.contact}
          </Link>

          <Link
            href="/privacy-policy"
            className="text-gray-600 transition hover:text-green-700"
          >
            {t.privacy}
          </Link>

          <Link
            href="/terms"
            className="text-gray-600 transition hover:text-green-700"
          >
            {t.terms}
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          {t.rights}
        </p>
      </div>
    </footer>
  );
}