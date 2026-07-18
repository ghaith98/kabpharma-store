"use client";

import type {
  CSSProperties,
} from "react";

import Link from "next/link";
import { getImageProps } from "next/image";
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

  const {
    props: {
      srcSet: mobileSrcSet,
      ...responsiveImageProps
    },
  } = getImageProps({
    src: mobileImage,
    alt: title,
    width: 393,
    height: 680,
    sizes: "100vw",
  });

  return (
    <section
      aria-labelledby="new-arrivals-title"
      className="relative w-full overflow-hidden bg-[#f4f5f2]"
    >
      {/*
        Mobile height:
        393px width = تقريباً 680px height.

        Desktop height:
        1600px width = 620px height.
      */}
      <div
        dir="ltr"
        className="relative h-[clamp(620px,173vw,720px)] w-full overflow-hidden md:h-[clamp(520px,38.75vw,680px)]"
      >
        {/* Responsive LCP image */}
        <picture className="absolute inset-0 block h-full w-full overflow-hidden">
          <source
            media="(min-width: 768px)"
            srcSet={desktopSrcSet}
          />

          <source
            media="(max-width: 767px)"
            srcSet={mobileSrcSet}
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

        {/* Mobile readability */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,246,244,0.96)_0%,rgba(245,246,244,0.88)_33%,rgba(245,246,244,0.30)_55%,rgba(245,246,244,0)_72%)] md:hidden" />

        {/* Desktop readability */}
        <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(245,246,244,0.98)_0%,rgba(245,246,244,0.92)_31%,rgba(245,246,244,0.55)_46%,rgba(245,246,244,0)_64%)] md:block" />

        {/* Content container */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 py-7 sm:px-8 sm:py-9 md:px-12 md:py-9 lg:px-16">
          {/* Breadcrumb remains left in both languages */}
          <nav
            dir="ltr"
            aria-label={
              isArabic
                ? "مسار الصفحة"
                : "Breadcrumb"
            }
            className="flex shrink-0 items-center gap-2 text-xs font-semibold text-[#718078] sm:text-sm"
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
              className="font-extrabold text-[#26352d]"
            >
              {isArabic
                ? "وصل حديثاً"
                : "New Arrivals"}
            </span>
          </nav>

          {/*
            الحاوية ثابتة باليسار.
            RTL يطبّق فقط داخل النص.
          */}
          <div className="flex min-h-0 flex-1 items-start pt-12 sm:pt-16 md:items-center md:pt-0">
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
                className={`text-[11px] font-extrabold uppercase text-[#0a583b] sm:text-xs ${
                  isArabic
                    ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                    : "tracking-[0.2em]"
                }`}
              >
                KAB Pharma
              </p>

              <h1
                id="new-arrivals-title"
                className={`mt-3 text-[clamp(2.25rem,9vw,3.25rem)] font-extrabold leading-[1.12] text-[#142019] md:text-[clamp(2.75rem,3.4vw,4rem)] ${
                  isArabic
                    ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                    : "tracking-[-0.04em]"
                }`}
              >
                {title}
              </h1>

              {description && (
                <p className="mt-5 max-w-[470px] text-sm font-medium leading-7 text-[#526058] sm:text-base sm:leading-8 md:text-[17px]">
                  {description}
                </p>
              )}
            </div>
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
