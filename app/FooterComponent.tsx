"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  const t = {
    en: {
      slogan: "THE QUALITY FOR A HEALTHIER LIFE",
      about: "About Us",
      contact: "Contact Us",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      rights: "© 2026 KAB Pharma. All rights reserved.",
    },
    ar: {
      slogan: "الجودة لحياة أكثر صحة",
      about: "من نحن",
      contact: "تواصل معنا",
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

        <p className="mt-3 text-gray-600">
          {t.slogan}
        </p>

        {/* Social media */}
        <div className="mt-6 flex justify-center gap-4">
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

        {/* Footer links */}
        <nav
          aria-label={lang === "ar" ? "روابط التذييل" : "Footer links"}
          className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium"
        >
          <Link
            href="/about"
            className="text-gray-600 transition hover:text-green-700"
          >
            {t.about}
          </Link>

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
        </nav>

        <p className="mt-6 text-sm text-gray-500">
          {t.rights}
        </p>
      </div>
    </footer>
  );
}