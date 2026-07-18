"use client";

import type {
  CSSProperties,
} from "react";

import Link from "next/link";

import {
  getImageProps,
} from "next/image";

import {
  ChevronRight,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

type CropMode =
  | "desktop"
  | "mobile";

type CropSettings = {
  x: number;
  y: number;
  zoom: number;
};

type BannerData = {
  id?: number;

  image_url?: string | null;
  image_url_mobile?: string | null;

  title?: string | null;
  title_ar?: string | null;
  title_en?: string | null;

  text?: string | null;
  text_ar?: string | null;
  text_en?: string | null;

  desktop_position_x?: number | null;
  desktop_position_y?: number | null;
  desktop_zoom?: number | null;

  mobile_position_x?: number | null;
  mobile_position_y?: number | null;
  mobile_zoom?: number | null;
};

function clamp(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
) {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(
      minimum,
      numberValue
    )
  );
}

function getCropSettings(
  banner: BannerData,
  mode: CropMode
): CropSettings {
  return {
    x: clamp(
      banner[
        `${mode}_position_x`
      ],
      0,
      100,
      50
    ),

    y: clamp(
      banner[
        `${mode}_position_y`
      ],
      0,
      100,
      50
    ),

    zoom: clamp(
      banner[
        `${mode}_zoom`
      ],
      1,
      1.6,
      1
    ),
  };
}

export default function NewArrivalsBanner({
  banner,
}: {
  banner:
    | BannerData
    | null;
}) {
  const { lang } =
    useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const isArabic =
    currentLang === "ar";

  if (
    !banner?.image_url
  ) {
    return null;
  }

  const title = isArabic
    ? banner.title_ar ||
      banner.title ||
      "وصل حديثاً"
    : banner.title_en ||
      banner.title ||
      "New Arrivals";

  const description =
    isArabic
      ? banner.text_ar ||
        banner.text ||
        "اكتشفي أحدث منتجات KAB Pharma للعناية بالبشرة والشعر والجسم."
      : banner.text_en ||
        banner.text ||
        "Discover the latest KAB Pharma products for skin, hair, and body care.";

  const desktopImage =
    banner.image_url;

  const mobileImage =
    banner.image_url_mobile ||
    desktopImage;

  const desktopCrop =
    getCropSettings(
      banner,
      "desktop"
    );

  const mobileCrop =
    getCropSettings(
      banner,
      "mobile"
    );

  const cropVariables = {
    "--desktop-position":
      `${desktopCrop.x}% ${desktopCrop.y}%`,

    "--desktop-zoom":
      desktopCrop.zoom,

    "--mobile-position":
      `${mobileCrop.x}% ${mobileCrop.y}%`,

    "--mobile-zoom":
      mobileCrop.zoom,
  } as CSSProperties;

  const {
    props: {
      srcSet: desktopSrcSet,
    },
  } = getImageProps({
    src: desktopImage,
    alt: title,
    width: 1600,
    height: 620,
    sizes: "100vw",
  });

  /*
    Mobile banner الجديد:
    نسبة 2:1 بدل الصورة الطويلة القديمة.
    الحجم المقترح للرفع: 800 × 400.
  */
  const {
    props: {
      srcSet: mobileSrcSet,
      ...responsiveImageProps
    },
  } = getImageProps({
    src: mobileImage,
    alt: title,
    width: 800,
    height: 400,
    sizes: "100vw",
  });

  function renderBreadcrumb() {
    return (
      <nav
        dir="ltr"
        aria-label={
          isArabic
            ? "مسار الصفحة"
            : "Breadcrumb"
        }
        className="flex items-center gap-2 text-xs font-medium text-[#718078] sm:text-sm"
      >
        <Link
          href="/"
          className="rounded-sm transition-colors hover:text-[#0a583b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b] focus-visible:ring-offset-2"
        >
          <span
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
          >
            {isArabic
              ? "الرئيسية"
              : "Home"}
          </span>
        </Link>

        <ChevronRight
          aria-hidden="true"
          size={15}
          strokeWidth={1.8}
          className="shrink-0 text-[#9aa59e]"
        />

        <span
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          aria-current="page"
          className="font-bold text-[#26352d]"
        >
          {isArabic
            ? "وصل حديثاً"
            : "New Arrivals"}
        </span>
      </nav>
    );
  }

  return (
    <section
      aria-label={title}
      className="relative w-full overflow-hidden bg-white"
    >
      {/*
        صورة واحدة responsive:
        Mobile: 200–220px فقط.
        Desktop: full hero.
      */}
      <div
        dir="ltr"
        className="relative h-[200px] w-full overflow-hidden bg-[#f4f5f2] sm:h-[230px] md:absolute md:inset-0 md:h-full"
      >
        <picture className="absolute inset-0 block h-full w-full overflow-hidden">
          <source
            media="(min-width: 768px)"
            srcSet={
              desktopSrcSet
            }
          />

          <source
            media="(max-width: 767px)"
            srcSet={
              mobileSrcSet
            }
          />

          <img
            {...responsiveImageProps}
            alt={
              title ||
              "KAB Pharma new arrivals"
            }
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            style={
              cropVariables
            }
            className="new-arrivals-hero-image absolute inset-0 h-full w-full select-none object-cover will-change-transform"
          />
        </picture>

        {/* Mobile subtle readability */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.22)_42%,rgba(255,255,255,0)_70%)] md:hidden" />

        {/* Desktop readability */}
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(245,246,244,0.98)_0%,rgba(245,246,244,0.92)_31%,rgba(245,246,244,0.55)_46%,rgba(245,246,244,0)_64%)] md:block" />

        {/* Mobile breadcrumb فوق الصورة */}
        <div className="absolute inset-x-0 top-0 z-20 px-5 py-6 sm:px-8 md:hidden">
          {renderBreadcrumb()}
        </div>
      </div>

      {/* Mobile title/content تحت الصورة */}
      <div
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className={`border-b border-[#edf0ed] bg-white px-5 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-8 md:hidden ${
          isArabic
            ? "text-right"
            : "text-left"
        }`}
      >
        <h1
          className={`text-[30px] font-extrabold leading-[1.15] text-[#142019] sm:text-[34px] ${
            isArabic
              ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
              : "tracking-[-0.035em]"
          }`}
        >
          {title}
        </h1>

        {description && (
          <p className="mt-4 max-w-[520px] text-sm leading-6 text-[#526058] sm:text-[15px] sm:leading-7">
            {description}
          </p>
        )}
      </div>

      {/* Desktop hero يبقى مثل التصميم الحالي */}
      <div className="relative z-10 mx-auto hidden h-[clamp(520px,38.75vw,680px)] w-full max-w-[1440px] flex-col px-12 py-9 md:flex lg:px-16">
        <div className="shrink-0">
          {renderBreadcrumb()}
        </div>

        <div className="flex min-h-0 flex-1 items-center">
          <div
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className={`w-full max-w-[510px] ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            <p
              className={`text-xs font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                  : "tracking-[0.2em]"
              }`}
            >
              KAB Pharma
            </p>

            <h1
              className={`mt-3 text-[clamp(2.75rem,3.4vw,4rem)] font-extrabold leading-[1.08] text-[#142019] ${
                isArabic
                  ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                  : "tracking-[-0.04em]"
              }`}
            >
              {title}
            </h1>

            {description && (
              <p className="mt-5 max-w-[470px] text-[17px] font-medium leading-8 text-[#526058]">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .new-arrivals-hero-image {
          object-position: var(
            --mobile-position
          );

          transform: scale(
            var(--mobile-zoom)
          );

          transform-origin: var(
            --mobile-position
          );
        }

        @media (min-width: 768px) {
          .new-arrivals-hero-image {
            object-position: var(
              --desktop-position
            );

            transform: scale(
              var(--desktop-zoom)
            );

            transform-origin: var(
              --desktop-position
            );
          }
        }

        @media (
          prefers-reduced-motion:
            reduce
        ) {
          .new-arrivals-hero-image {
            will-change: auto;
          }
        }
      `}</style>
    </section>
  );
}