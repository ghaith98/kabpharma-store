"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaMinus,
  FaPlus,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import { useLanguage } from "../context/LanguageContext";

type SectionKey =
  | "explore"
  | "company"
  | "policies";

export default function Footer() {
  const { lang } = useLanguage();

  const isArabic =
    lang === "ar";

  const [openSection, setOpenSection] =
    useState<SectionKey | null>(null);

  const currentYear =
    new Date().getFullYear();

  const text = {
    en: {
      slogan:
        "THE QUALITY FOR A HEALTHIER LIFE",

      description:
        "Clinical and personal care products designed to support healthier everyday routines.",

      explore: "Explore",
      products: "All products",
      wishlist: "My wishlist",

      company: "Company",
      about: "About KAB Pharma",
      contact: "Contact our team",

      policies: "Policies",
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      refund: "Refund Policy",

      shopNow: "Explore our products",

      rights: `© ${currentYear} KAB Pharma. All rights reserved.`,

      navigation:
        "Footer navigation",
    },

    ar: {
      slogan:
        "الجودة لحياة أكثر صحة",

      description:
        "منتجات للعناية الشخصية واليومية مصممة لدعم حياة أكثر صحة وراحة.",

      explore: "اكتشف",
      products: "جميع المنتجات",
      wishlist: "قائمة المفضلة",

      company: "عن الشركة",
      about: "عن KAB Pharma",
      contact: "تواصل مع فريقنا",

      policies: "السياسات",
      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      refund: "سياسة الاسترجاع",

      shopNow: "اكتشف منتجاتنا",

      rights: `© ${currentYear} KAB Pharma. جميع الحقوق محفوظة.`,

      navigation:
        "روابط تذييل الموقع",
    },
  };

  const t =
    text[
      lang as "en" | "ar"
    ];

  const sections: Array<{
    key: SectionKey;
    title: string;
    links: Array<{
      label: string;
      href: string;
    }>;
  }> = [
    {
      key: "explore",
      title: t.explore,
      links: [
        {
          label: t.products,
          href: "/products",
        },
        {
          label: t.wishlist,
          href: "/wishlist",
        },
      ],
    },

    {
      key: "company",
      title: t.company,
      links: [
        {
          label: t.about,
          href: "/about",
        },
        {
          label: t.contact,
          href: "/contact",
        },
      ],
    },

    {
      key: "policies",
      title: t.policies,
      links: [
        {
          label: t.privacy,
          href: "/privacy-policy",
        },
        {
          label: t.terms,
          href: "/terms",
        },
        {
          label: t.refund,
          href: "/refund-policy",
        },
      ],
    },
  ];

  const ArrowIcon =
    isArabic
      ? FiArrowLeft
      : FiArrowRight;

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

  const footerLinkClass =
    "group inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#526057] transition hover:text-[#0a583b]";

  const socialButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-full border border-[#d9e0db] bg-white text-[#0a583b] transition duration-300 hover:-translate-y-0.5 hover:border-[#0a583b] hover:bg-[#0a583b] hover:text-white hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#edf5f0]";

  return (
    <footer
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="mt-auto border-t border-[#dfe4e0] bg-[#f7f8f6]"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-12 sm:px-6 sm:pt-14 md:pb-8 lg:px-8">
        {/* Desktop footer */}
        <div className="hidden gap-12 lg:grid lg:grid-cols-[1.45fr_0.75fr_0.75fr_1fr]">
          {/* Brand */}
          <div
            className={
              isArabic
                ? "text-right"
                : "text-left"
            }
          >
            <Link
              href="/"
              aria-label="KAB Pharma home"
              className="inline-flex"
            >
              <Image
                src="/logo.png"
                alt="KAB Pharma"
                width={230}
                height={75}
                className="h-auto w-[210px] mix-blend-multiply"
              />
            </Link>

            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0a583b]">
              {t.slogan}
            </p>

            <p className="mt-4 max-w-[390px] text-sm leading-7 text-[#647168]">
              {t.description}
            </p>

            <Link
              href="/products"
              className="group mt-6 inline-flex items-center gap-3 rounded-full bg-[#0a583b] px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-md"
            >
              <span>
                {t.shopNow}
              </span>

              <ArrowIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>

            <div className="mt-7 flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className={
                  socialButtonClass
                }
              >
                <FaFacebookF
                  size={16}
                />
              </a>

              <a
                href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className={
                  socialButtonClass
                }
              >
                <FaInstagram
                  size={18}
                />
              </a>
            </div>
          </div>

          {/* Desktop navigation */}
          {sections.map(
            (section) => (
              <section
                key={
                  section.key
                }
              >
                <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#142019]">
                  {section.title}
                </h2>

                <nav
                  aria-label={
                    section.title
                  }
                  className="mt-6 flex flex-col items-start gap-4"
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
                          footerLinkClass
                        }
                      >
                        <span className="relative">
                          {item.label}

                          <span className="absolute inset-x-0 -bottom-1 h-px origin-left scale-x-0 bg-[#0a583b] transition-transform group-hover:scale-x-100 rtl:origin-right" />
                        </span>

                        <ArrowIcon className="text-sm opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100 rtl:group-hover:-translate-x-1" />
                      </Link>
                    )
                  )}
                </nav>
              </section>
            )
          )}
        </div>

        {/* Mobile brand */}
        <div className="text-center lg:hidden">
          <Link
            href="/"
            aria-label="KAB Pharma home"
            className="inline-flex"
          >
            <Image
              src="/logo.png"
              alt="KAB Pharma"
              width={230}
              height={75}
              className="h-auto w-[205px] mix-blend-multiply"
            />
          </Link>

          <p
            className={`mt-5 text-xs font-extrabold uppercase text-[#0a583b] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[0.14em]"
            }`}
          >
            {t.slogan}
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#647168]">
            {t.description}
          </p>

          <Link
            href="/products"
            className="group mt-6 inline-flex items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 py-3.5 text-sm font-extrabold text-white transition active:scale-[0.98]"
          >
            <span>
              {t.shopNow}
            </span>

            <ArrowIcon />
          </Link>

          <div className="mt-6 flex justify-center gap-3">
            <a
              href="https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={
                socialButtonClass
              }
            >
              <FaFacebookF
                size={16}
              />
            </a>

            <a
              href="https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={
                socialButtonClass
              }
            >
              <FaInstagram
                size={18}
              />
            </a>
          </div>
        </div>

        {/* Mobile accordion */}
        <div
          className="mt-10 border-y border-[#dfe4e0] lg:hidden"
          aria-label={
            t.navigation
          }
        >
          {sections.map(
            (section) => {
              const isOpen =
                openSection ===
                section.key;

              const sectionId =
                `footer-${section.key}`;

              return (
                <section
                  key={
                    section.key
                  }
                  className="border-b border-[#dfe4e0] last:border-b-0"
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
                    className="flex w-full items-center justify-between gap-5 py-5 text-start"
                  >
                    <span className="text-base font-extrabold text-[#142019]">
                      {
                        section.title
                      }
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                        isOpen
                          ? "bg-[#0a583b] text-white"
                          : "bg-[#edf1ee] text-[#526057]"
                      }`}
                    >
                      {isOpen ? (
                        <FaMinus
                          size={11}
                        />
                      ) : (
                        <FaPlus
                          size={11}
                        />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <nav
                      id={
                        sectionId
                      }
                      aria-label={
                        section.title
                      }
                      className="flex flex-col items-start gap-4 pb-6"
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
                              footerLinkClass
                            }
                          >
                            <span>
                              {
                                item.label
                              }
                            </span>

                            <ArrowIcon className="text-sm opacity-60" />
                          </Link>
                        )
                      )}
                    </nav>
                  )}
                </section>
              );
            }
          )}
        </div>

        {/* Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#dfe4e0] pt-6 text-center sm:flex-row sm:text-start">
          <p className="text-xs leading-6 text-[#7a857e] sm:text-sm">
            {t.rights}
          </p>

          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#0a583b]">
            KAB Pharma
          </p>
        </div>
      </div>
    </footer>
  );
}