"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

type SectionKey = "about" | "contact" | "policies";

export default function Footer() {
  const { lang } = useLanguage();
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const isArabic = lang === "ar";

  const t = {
    en: {
      slogan: "THE QUALITY FOR A HEALTHIER LIFE",
      about: "About Us",
      contact: "Contact Us",
      policies: "Policies",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      refund: "Refund Policy",
      aboutText:
        "Learn more about KAB Pharma, our values, and our commitment to quality personal care.",
      contactText:
        "Need help? Reach out to our customer service team anytime.",
      rights: "© 2026 KAB Pharma. All rights reserved.",
      footerLinks: "Footer links",
    },
    ar: {
      slogan: "الجودة لحياة أكثر صحة",
      about: "من نحن",
      contact: "تواصل معنا",
      policies: "السياسات",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      refund: "سياسة الاسترجاع",
      aboutText:
        "تعرّف على KAB Pharma وقيمنا واهتمامنا بتقديم منتجات عناية شخصية موثوقة.",
      contactText:
        "هل تحتاج إلى مساعدة؟ تواصل مع فريق خدمة العملاء في أي وقت.",
      rights: "© 2026 KAB Pharma. جميع الحقوق محفوظة.",
      footerLinks: "روابط التذييل",
    },
  }[lang as "en" | "ar"];

  function toggleSection(section: SectionKey) {
    setOpenSection((prev) => (prev === section ? null : section));
  }

  const socialButtonClass =
    "group flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50 hover:text-green-700 hover:shadow-md";

  const mobileSectionButtonClass =
    "flex w-full items-center justify-between border-b border-gray-200 py-5 text-start";

  const mobileLinkClass =
    "block py-2 text-sm text-gray-600 transition hover:text-green-700";

  const desktopLinkClass =
    "text-sm text-gray-600 transition hover:text-green-700";

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="mt-auto border-t border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] md:py-10">
        {/* Top brand area */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-green-700">KAB Pharma</h3>

          <p className="mt-3 text-sm text-gray-600 md:text-base">{t.slogan}</p>

          {/* Better social icons */}
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={socialButtonClass}
            >
              <FaFacebookF size={18} />
            </a>

            <a
              href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={socialButtonClass}
            >
              <FaInstagram size={20} />
            </a>
          </div>
        </div>

        {/* MOBILE ACCORDION */}
        <div className="mt-8 md:hidden">
          {/* About */}
          <button
            type="button"
            onClick={() => toggleSection("about")}
            className={mobileSectionButtonClass}
            aria-expanded={openSection === "about"}
          >
            <span className="text-lg font-semibold text-gray-900">
              {t.about}
            </span>

            <span className="text-xl text-gray-700">
              {openSection === "about" ? <FaMinus /> : <FaPlus />}
            </span>
          </button>

          {openSection === "about" && (
            <div className="pb-4 pt-3">
              <p className="mb-3 text-sm leading-7 text-gray-500">
                {t.aboutText}
              </p>

              <Link href="/about" className={mobileLinkClass}>
                {t.about}
              </Link>
            </div>
          )}

          {/* Contact */}
          <button
            type="button"
            onClick={() => toggleSection("contact")}
            className={mobileSectionButtonClass}
            aria-expanded={openSection === "contact"}
          >
            <span className="text-lg font-semibold text-gray-900">
              {t.contact}
            </span>

            <span className="text-xl text-gray-700">
              {openSection === "contact" ? <FaMinus /> : <FaPlus />}
            </span>
          </button>

          {openSection === "contact" && (
            <div className="pb-4 pt-3">
              <p className="mb-3 text-sm leading-7 text-gray-500">
                {t.contactText}
              </p>

              <Link href="/contact" className={mobileLinkClass}>
                {t.contact}
              </Link>
            </div>
          )}

          {/* Policies */}
          <button
            type="button"
            onClick={() => toggleSection("policies")}
            className={mobileSectionButtonClass}
            aria-expanded={openSection === "policies"}
          >
            <span className="text-lg font-semibold text-gray-900">
              {t.policies}
            </span>

            <span className="text-xl text-gray-700">
              {openSection === "policies" ? <FaMinus /> : <FaPlus />}
            </span>
          </button>

          {openSection === "policies" && (
            <div className="pb-4 pt-3">
              <Link href="/privacy-policy" className={mobileLinkClass}>
                {t.privacy}
              </Link>

              <Link href="/terms" className={mobileLinkClass}>
                {t.terms}
              </Link>

              <Link href="/refund-policy" className={mobileLinkClass}>
                {t.refund}
              </Link>
            </div>
          )}
        </div>

        {/* DESKTOP FOOTER LINKS */}
        <div className="mt-10 hidden grid-cols-3 gap-10 border-t border-gray-200 pt-8 md:grid">
          <div>
            <h4 className="text-base font-semibold text-gray-900">{t.about}</h4>

            <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500">
              {t.aboutText}
            </p>

            <div className="mt-4">
              <Link href="/about" className={desktopLinkClass}>
                {t.about}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {t.contact}
            </h4>

            <p className="mt-3 max-w-sm text-sm leading-7 text-gray-500">
              {t.contactText}
            </p>

            <div className="mt-4">
              <Link href="/contact" className={desktopLinkClass}>
                {t.contact}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {t.policies}
            </h4>

            <nav
              aria-label={t.footerLinks}
              className="mt-4 flex flex-col gap-3"
            >
              <Link href="/privacy-policy" className={desktopLinkClass}>
                {t.privacy}
              </Link>

              <Link href="/terms" className={desktopLinkClass}>
                {t.terms}
              </Link>

              <Link href="/refund-policy" className={desktopLinkClass}>
                {t.refund}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">{t.rights}</p>
        </div>
      </div>
    </footer>
  );
}