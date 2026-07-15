"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

type SectionKey =
  | "shop"
  | "care"
  | "company"
  | "policies";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  key: SectionKey;
  title: string;
  links: FooterLink[];
};

export default function Footer() {
  const { lang, setLang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const [openSection, setOpenSection] =
    useState<SectionKey | null>(null);

  const currentYear =
    new Date().getFullYear();

  const text = {
    en: {
      eyebrow: "KAB Pharma",

      statement:
        "Thoughtful care, made for everyday life.",

      description:
        "Reliable formulations for skin, hair and personal care—designed with clarity, quality and purpose.",

      guidance:
        "Need help choosing a product?",

      contactTeam:
        "Speak to our team",

      shop: "Shop",
      allProducts: "All products",
      wishlist: "Wishlist",

      care: "Customer care",
      contact: "Contact us",
      account: "My account",

      company: "Company",
      about: "About KAB Pharma",

      policies: "Legal",
      privacy: "Privacy policy",
      terms: "Terms & conditions",
      refund: "Refund policy",

      follow: "Follow",

      rights:
        `© ${currentYear} KAB Pharma. All rights reserved.`,

      quality:
        "The quality for a healthier life",

      navigation:
        "Footer navigation",
    },

    ar: {
      eyebrow: "KAB Pharma",

      statement:
        "عناية مدروسة، لحياة يومية أكثر صحة.",

      description:
        "تركيبات موثوقة للعناية بالبشرة والشعر والجسم، مصممة بوضوح وجودة واهتمام بالتفاصيل.",

      guidance:
        "بحاجة للمساعدة في اختيار منتج؟",

      contactTeam:
        "تواصل مع فريقنا",

      shop: "المتجر",
      allProducts: "جميع المنتجات",
      wishlist: "قائمة المفضلة",

      care: "خدمة العملاء",
      contact: "تواصل معنا",
      account: "حسابي",

      company: "عن الشركة",
      about: "عن KAB Pharma",

      policies: "السياسات",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      refund: "سياسة الاسترجاع",

      follow: "تابعنا",

      rights:
        `© ${currentYear} KAB Pharma. جميع الحقوق محفوظة.`,

      quality:
        "الجودة لحياة أكثر صحة",

      navigation:
        "روابط تذييل الموقع",
    },
  };

  const t =
    text[
      lang as "en" | "ar"
    ];

  const ArrowIcon =
    isArabic
      ? ArrowLeft
      : ArrowRight;

  const sections: FooterSection[] = [
    {
      key: "shop",
      title: t.shop,

      links: [
        {
          label:
            t.allProducts,

          href:
            "/products",
        },
        {
          label:
            t.wishlist,

          href:
            "/wishlist",
        },
      ],
    },

    {
      key: "care",
      title: t.care,

      links: [
        {
          label:
            t.contact,

          href:
            "/contact",
        },
        {
          label:
            t.account,

          href:
            "/profile",
        },
      ],
    },

    {
      key: "company",
      title: t.company,

      links: [
        {
          label:
            t.about,

          href:
            "/about",
        },
      ],
    },

    {
      key: "policies",
      title: t.policies,

      links: [
        {
          label:
            t.privacy,

          href:
            "/privacy-policy",
        },
        {
          label:
            t.terms,

          href:
            "/terms",
        },
        {
          label:
            t.refund,

          href:
            "/refund-policy",
        },
      ],
    },
  ];

  const socialLinks = [
    {
      label: "Facebook",

      href:
        "https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr",

      Icon: FaFacebookF,
    },
    {
      label: "Instagram",

      href:
        "https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr",

      Icon: FaInstagram,
    },
  ];

  function toggleSection(
    section: SectionKey
  ) {
    setOpenSection(
      (current) =>
        current === section
          ? null
          : section
    );
  }

  function changeLanguage(
    nextLanguage: "ar" | "en"
  ) {
    if (lang === nextLanguage) {
      return;
    }

    setLang(nextLanguage);
  }

  const desktopLinkClass =
    "group inline-flex w-fit items-center gap-2 text-[15px] leading-6 text-[#4f5d54] transition-colors duration-200 hover:text-[#0a583b]";

  const mobileLinkClass =
    "group inline-flex w-full items-center justify-between gap-4 py-1 text-[15px] leading-7 text-[#4f5d54] transition-colors hover:text-[#0a583b]";

const socialIconClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#a9c1b2] bg-transparent text-[#0a583b] transition duration-300 hover:-translate-y-1 hover:border-[#0a583b] hover:bg-[#0a583b] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#dfeae3]";
  return (
    <footer
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="mt-auto border-t border-[#dfe4e0] bg-[#f2f3ef] text-[#142019]"
    >
      <div className="mx-auto max-w-[1600px] px-5 sm:px-6 lg:px-10">
        {/* Editorial introduction */}
        <section className="grid gap-10 border-b border-[#cfd6d1] py-14 sm:py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)] lg:items-end lg:gap-20 lg:py-20">
          <div>
            <p
              dir="ltr"
              className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#0a583b]"
            >
              {t.eyebrow}
            </p>

            <h2
              className={`mt-5 max-w-[950px] font-extrabold text-[#142019] ${
                isArabic
                  ? "text-[38px] leading-[1.22] tracking-normal [font-family:Tahoma,Arial,sans-serif] sm:text-[48px] lg:text-[64px]"
                  : "text-[42px] leading-[0.98] tracking-[-0.055em] sm:text-[58px] lg:text-[82px]"
              }`}
            >
              {t.statement}
            </h2>
          </div>

          <div
            className={
              isArabic
                ? "text-right"
                : "text-left"
            }
          >
            <p className="max-w-lg text-[15px] leading-8 text-[#526057] sm:text-base">
              {t.description}
            </p>

            <div className="mt-7">
              <p className="text-sm text-[#7a857e]">
                {t.guidance}
              </p>

              <Link
                href="/contact"
                className="group mt-2 inline-flex items-center gap-3 border-b border-[#142019] pb-1 text-sm font-extrabold text-[#142019] transition-colors hover:border-[#0a583b] hover:text-[#0a583b]"
              >
                <span>
                  {t.contactTeam}
                </span>

                <ArrowIcon
                  size={15}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${
                    isArabic
                      ? "group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                />
              </Link>
            </div>
          </div>
        </section>

        {/* Desktop navigation */}
        <section
          aria-label={t.navigation}
          className="hidden grid-cols-5 gap-10 border-b border-[#cfd6d1] py-12 md:grid lg:gap-16"
        >
          {sections.map(
            (section) => (
              <nav
                key={section.key}
                aria-label={
                  section.title
                }
              >
                <h3
                  className={`text-[11px] font-extrabold uppercase text-[#142019] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.15em]"
                  }`}
                >
                  {section.title}
                </h3>

                <div className="mt-6 flex flex-col items-start gap-3.5">
                  {section.links.map(
                    (item) => (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        className={
                          desktopLinkClass
                        }
                      >
                        <span className="relative">
                          {item.label}

                          <span
                            className={`absolute inset-x-0 -bottom-0.5 h-px scale-x-0 bg-[#0a583b] transition-transform duration-200 group-hover:scale-x-100 ${
                              isArabic
                                ? "origin-right"
                                : "origin-left"
                            }`}
                          />
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </nav>
            )
          )}

          {/* Desktop social */}
          <nav
            aria-label={t.follow}
          >
            <h3
              className={`text-[11px] font-extrabold uppercase text-[#142019] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.15em]"
              }`}
            >
              {t.follow}
            </h3>

            <div
  dir="ltr"
  className={`mt-5 flex w-full items-center gap-2.5 ${
    isArabic
      ? "justify-end"
      : "justify-start"
  }`}
>
  {socialLinks.map(
    ({
      label,
      href,
      Icon,
    }) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        className={socialIconClass}
      >
        <Icon
          size={
            label === "Instagram"
              ? 18
              : 16
          }
        />
      </a>
    )
  )}
</div>
          </nav>
        </section>

        {/* Mobile navigation */}
        <section
          aria-label={t.navigation}
          className="border-b border-[#cfd6d1] md:hidden"
        >
          {sections.map(
            (section) => {
              const isOpen =
                openSection ===
                section.key;

              const sectionId =
                `footer-${section.key}`;

              return (
                <div
                  key={
                    section.key
                  }
                  className="border-b border-[#cfd6d1] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleSection(
                        section.key
                      )
                    }
                    aria-expanded={
                      isOpen
                    }
                    aria-controls={
                      sectionId
                    }
                    className="flex min-h-[62px] w-full items-center justify-between gap-6 text-start"
                  >
                    <span
                      className={`text-[12px] font-extrabold uppercase text-[#142019] ${
                        isArabic
                          ? "tracking-normal"
                          : "tracking-[0.13em]"
                      }`}
                    >
                      {section.title}
                    </span>

                    {isOpen ? (
                      <Minus
                        size={17}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Plus
                        size={17}
                        strokeWidth={1.5}
                      />
                    )}
                  </button>

                  {isOpen && (
                    <nav
                      id={sectionId}
                      aria-label={
                        section.title
                      }
                      className="space-y-2 pb-6"
                    >
                      {section.links.map(
                        (item) => (
                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            className={
                              mobileLinkClass
                            }
                          >
                            <span>
                              {item.label}
                            </span>

                            <ArrowIcon
                              size={14}
                              className="opacity-45"
                            />
                          </Link>
                        )
                      )}
                    </nav>
                  )}
                </div>
              );
            }
          )}

          {/* Mobile social */}
          <div className="py-7">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#142019] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.14em]"
              }`}
            >
              {t.follow}
            </p>

            <div
  dir="ltr"
  className={`mt-5 flex w-full items-center gap-2.5 ${
    isArabic
      ? "justify-end"
      : "justify-start"
  }`}
>
              {socialLinks.map(
                ({
                  label,
                  href,
                  Icon,
                }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className={
                      socialIconClass
                    }
                  >
                    <Icon
                      size={
                        label ===
                        "Instagram"
                          ? 18
                          : 16
                      }
                    />
                  </a>
                )
              )}
            </div>
          </div>
        </section>

        {/* Large brand signature */}
        <Link
          href="/"
          dir="ltr"
          aria-label="KAB Pharma home"
          className="group block overflow-hidden border-b border-[#cfd6d1] py-9 sm:py-12 lg:py-14"
        >
          <div className="flex items-end whitespace-nowrap">
            <span className="text-[clamp(3.1rem,10.7vw,10rem)] font-black leading-[0.78] tracking-[-0.075em] text-[#142019] transition-colors duration-300 group-hover:text-[#0a583b]">
              KAB
            </span>

            <span className="ml-[0.07em] text-[clamp(3.1rem,10.7vw,10rem)] font-light leading-[0.78] tracking-[-0.075em] text-[#4f5d54] transition-colors duration-300 group-hover:text-[#0a583b]">
              PHARMA
            </span>
          </div>
        </Link>

        {/* Copyright */}
        <div className="flex flex-col gap-3 pt-6 text-xs text-[#7a857e] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t.rights}
          </p>

          <p
            className={`font-bold uppercase text-[#526057] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[0.12em]"
            }`}
          >
            {t.quality}
          </p>
        </div>

        {/* Language selector */}
        <div
          dir="ltr"
          className="pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-8 text-center md:pb-7"
        >
          <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#8a948d]">
            Language
          </p>

          <div className="mt-3 inline-flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                changeLanguage(
                  "ar"
                )
              }
              aria-pressed={
                lang === "ar"
              }
              className={`relative pb-1 text-xs font-extrabold tracking-[0.12em] transition ${
                lang === "ar"
                  ? "text-[#0a583b]"
                  : "text-[#8a948d] hover:text-[#142019]"
              }`}
            >
              AR

              {lang === "ar" && (
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#0a583b]" />
              )}
            </button>

            <span className="h-3 w-px bg-[#cbd3cd]" />

            <button
              type="button"
              onClick={() =>
                changeLanguage(
                  "en"
                )
              }
              aria-pressed={
                lang === "en"
              }
              className={`relative pb-1 text-xs font-extrabold tracking-[0.12em] transition ${
                lang === "en"
                  ? "text-[#0a583b]"
                  : "text-[#8a948d] hover:text-[#142019]"
              }`}
            >
              EN

              {lang === "en" && (
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#0a583b]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}