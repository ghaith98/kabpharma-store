"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  const t = {
    en: {
      slogan: "THE QUALITY FOR A HEALTHIER LIFE",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      rights: "© 2026 KAB Pharma. All rights reserved.",
    },
    ar: {
      slogan: "الجودة لحياة أكثر صحة",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      rights: "© 2026 KAB Pharma. جميع الحقوق محفوظة.",
    },
  }[lang as "en" | "ar"];

  return (
    <footer className="mt-auto border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10 text-center">
        <h3 className="text-xl font-bold text-green-700">KAB Pharma</h3>

        <p className="mt-3 text-gray-600">{t.slogan}</p>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
          >
            <FaFacebookF size={20} />
          </a>

          <a
            href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-green-600 hover:text-green-700"
          >
            <FaInstagram size={20} />
          </a>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-sm font-medium">
          <Link
            href="/privacy-policy"
            className="text-gray-600 hover:text-green-700"
          >
            {t.privacy}
          </Link>

          <Link href="/terms" className="text-gray-600 hover:text-green-700">
            {t.terms}
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">{t.rights}</p>
      </div>
    </footer>
  );
}