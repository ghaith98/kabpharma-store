"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaPlus,
  FaMinus,
  FaChevronRight,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

type SectionKey = "about" | "contact" | "policies";

export default function Footer() {
  const { lang } = useLanguage();
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    null
  );

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
      viewAbout: "Discover KAB Pharma",
      contactTeam: "Contact our team",
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
      viewAbout: "تعرّف على KAB Pharma",
      contactTeam: "تواصل مع فريقنا",
      rights: "© 2026 KAB Pharma. جميع الحقوق محفوظة.",
      footerLinks: "روابط التذييل",
    },
  }[lang as "en" | "ar"];

  function toggleSection(section: SectionKey) {
    setOpenSection((currentSection) =>
      currentSection === section ? null : section
    );
  }

  const socialButtonClass =
    "group flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-200 bg-white text-green-700 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-600 hover:bg-green-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2";

  const mobileSectionButtonClass =
    "flex w-full items-center justify-between border-b border-gray-200 py-5 text-start transition hover:text-green-700";

  const mobileLinkClass =
    "group inline-flex items-center gap-2 py-2 text-sm font-bold text-green-700 transition hover:text-green-800 hover:underline";

  const desktopLinkClass =
    "group inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800 hover:underline";

  const arrowClass = `text-xs transition group-hover:translate-x-1 ${
    isArabic
      ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0"
      : ""
  }`;

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="mt-auto border-t border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-7xl px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-10 md:py-10">
        {/* Brand */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-green-700">
            KAB Pharma
          </h3>

          <p className="mt-3 text-sm text-gray-600 md:text-base">
            {t.slogan}
          </p>

          {/* Social media */}
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

        {/* Mobile accordion */}
        <div className="mt-8 border-t border-gray-200 md:hidden">
          {/* About */}
          <section>
            <button
              type="button"
              onClick={() => toggleSection("about")}
              className={mobileSectionButtonClass}
              aria-expanded={openSection === "about"}
              aria-controls="mobile-about-section"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t.about}
              </span>

              <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-gray-700">
                {openSection === "about" ? (
                  <FaMinus />
                ) : (
                  <FaPlus />
                )}
              </span>
            </button>

            {openSection === "about" && (
              <div
                id="mobile-about-section"
                className="border-b border-gray-200 pb-5 pt-3"
              >
                <Link href="/about" className={mobileLinkClass}>
                  <span>{t.viewAbout}</span>
                  <FaChevronRight className={arrowClass} />
                </Link>
              </div>
            )}
          </section>

          {/* Contact */}
          <section>
            <button
              type="button"
              onClick={() => toggleSection("contact")}
              className={mobileSectionButtonClass}
              aria-expanded={openSection === "contact"}
              aria-controls="mobile-contact-section"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t.contact}
              </span>

              <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-gray-700">
                {openSection === "contact" ? (
                  <FaMinus />
                ) : (
                  <FaPlus />
                )}
              </span>
            </button>

            {openSection === "contact" && (
              <div
                id="mobile-contact-section"
                className="border-b border-gray-200 pb-5 pt-3"
              >
                <Link href="/contact" className={mobileLinkClass}>
                  <span>{t.contactTeam}</span>
                  <FaChevronRight className={arrowClass} />
                </Link>
              </div>
            )}
          </section>

          {/* Policies */}
          <section>
            <button
              type="button"
              onClick={() => toggleSection("policies")}
              className={mobileSectionButtonClass}
              aria-expanded={openSection === "policies"}
              aria-controls="mobile-policies-section"
            >
              <span className="text-lg font-semibold text-gray-900">
                {t.policies}
              </span>

              <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-gray-700">
                {openSection === "policies" ? (
                  <FaMinus />
                ) : (
                  <FaPlus />
                )}
              </span>
            </button>

            {openSection === "policies" && (
              <nav
                id="mobile-policies-section"
                aria-label={t.footerLinks}
                className="flex flex-col items-start gap-1 border-b border-gray-200 pb-5 pt-3"
              >
                <Link
                  href="/privacy-policy"
                  className={mobileLinkClass}
                >
                  <span>{t.privacy}</span>
                  <FaChevronRight className={arrowClass} />
                </Link>

                <Link href="/terms" className={mobileLinkClass}>
                  <span>{t.terms}</span>
                  <FaChevronRight className={arrowClass} />
                </Link>

                <Link
                  href="/refund-policy"
                  className={mobileLinkClass}
                >
                  <span>{t.refund}</span>
                  <FaChevronRight className={arrowClass} />
                </Link>
              </nav>
            )}
          </section>
        </div>

        {/* Desktop links */}
        <div className="mt-10 hidden grid-cols-3 gap-12 border-t border-gray-200 pt-8 md:grid">
          {/* About */}
          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {t.about}
            </h4>

            <div className="mt-4">
              <Link href="/about" className={desktopLinkClass}>
                <span>{t.viewAbout}</span>
                <FaChevronRight className={arrowClass} />
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {t.contact}
            </h4>

            <div className="mt-4">
              <Link href="/contact" className={desktopLinkClass}>
                <span>{t.contactTeam}</span>
                <FaChevronRight className={arrowClass} />
              </Link>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {t.policies}
            </h4>

            <nav
              aria-label={t.footerLinks}
              className="mt-4 flex flex-col items-start gap-3"
            >
              <Link
                href="/privacy-policy"
                className={desktopLinkClass}
              >
                <span>{t.privacy}</span>
                <FaChevronRight className={arrowClass} />
              </Link>

              <Link href="/terms" className={desktopLinkClass}>
                <span>{t.terms}</span>
                <FaChevronRight className={arrowClass} />
              </Link>

              <Link
                href="/refund-policy"
                className={desktopLinkClass}
              >
                <span>{t.refund}</span>
                <FaChevronRight className={arrowClass} />
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">
            {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}