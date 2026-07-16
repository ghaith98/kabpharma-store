"use client";

import type { CSSProperties } from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  Autoplay,
  Navigation,
  Pagination,
} from "swiper/modules";

import { useLanguage } from "../context/LanguageContext";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type CropMode =
  | "desktop"
  | "mobile";

function clamp(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
) {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(numberValue)
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

function getCropStyle(
  slide: any,
  mode: CropMode
): CSSProperties {
  const positionX = clamp(
    slide?.[
      `${mode}_position_x`
    ],
    0,
    100,
    50
  );

  const positionY = clamp(
    slide?.[
      `${mode}_position_y`
    ],
    0,
    100,
    50
  );

  const zoom = clamp(
    slide?.[
      `${mode}_zoom`
    ],
    1,
    1.6,
    1
  );

  return {
    objectPosition:
      `${positionX}% ${positionY}%`,

    transform:
      `scale(${zoom})`,

    transformOrigin:
      `${positionX}% ${positionY}%`,
  };
}

export default function HomeBannerSwiper({
  banners,
}: {
  banners: any[];
}) {
  const { lang } =
    useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const isArabic =
    currentLang === "ar";

  const hasMultipleBanners =
    banners?.length > 1;

  if (!banners?.length) {
    return null;
  }

  return (
    <Swiper
      dir="ltr"
      modules={[
        Autoplay,
        Navigation,
        Pagination,
      ]}
      slidesPerView={1}
      loop={hasMultipleBanners}
      autoplay={
        hasMultipleBanners
          ? {
              delay: 6000,

              disableOnInteraction:
                false,

              pauseOnMouseEnter:
                true,
            }
          : false
      }
      navigation={
  hasMultipleBanners
    ? {
        prevEl:
          ".kab-banner-prev",
        nextEl:
          ".kab-banner-next",
      }
    : false
}
      pagination={
        hasMultipleBanners
          ? {
              clickable: true,
            }
          : false
      }
      className="kab-campaign-swiper relative"
    >
      {banners.map(
        (slide) => {
          const title =
            isArabic
              ? slide.title_ar ||
                slide.title
              : slide.title_en ||
                slide.title;

          const description =
            isArabic
              ? slide.text_ar ||
                slide.text
              : slide.text_en ||
                slide.text;

          const buttonText =
            isArabic
              ? slide.button_text_ar ||
                "اكتشف المنتج"
              : slide.button_text ||
                "Discover product";

          const mobileImage =
            slide.image_url_mobile ||
            slide.image_url;

          return (
            <SwiperSlide
              key={slide.id}
            >
              <article
                dir={
                  isArabic
                    ? "rtl"
                    : "ltr"
                }
                className="relative min-h-[680px] overflow-hidden bg-[#f6f6f3] md:min-h-[560px] lg:min-h-[620px]"
              >
                {/* Mobile image */}
                <div className="absolute inset-0 overflow-hidden md:hidden">
                  <img
                    src={
                      mobileImage
                    }
                    alt={
                      title ||
                      "KAB Pharma campaign"
                    }
                    className="absolute inset-0 h-full w-full object-cover will-change-transform"
                    style={getCropStyle(
                      slide,
                      "mobile"
                    )}
                  />
                </div>

                {/* Desktop image */}
                <div className="absolute inset-0 hidden overflow-hidden md:block">
                  <img
                    src={
                      slide.image_url
                    }
                    alt={
                      title ||
                      "KAB Pharma campaign"
                    }
                    className="absolute inset-0 h-full w-full object-cover will-change-transform"
                    style={getCropStyle(
                      slide,
                      "desktop"
                    )}
                  />
                </div>

                {/* Readability layer */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-transparent md:bg-gradient-to-r md:from-white/25 md:via-transparent md:to-transparent" />

                {/* Campaign content */}
                <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1440px] items-start px-5 py-10 sm:px-8 md:min-h-[560px] md:items-center md:px-12 lg:min-h-[620px] lg:px-16">
                  <div
                    className={`w-full max-w-[490px] md:ml-0 md:mr-auto md:w-[46%] ${
                      isArabic
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#0a583b] sm:text-xs">
                      KAB Pharma
                    </p>

                    <h1
                      className={`mt-3 max-w-[440px] text-[32px] font-extrabold leading-[1.2] text-[#142019] sm:text-4xl md:text-[44px] lg:text-[52px] ${
                        isArabic
                          ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                          : "leading-[1.08] tracking-[-0.035em]"
                      }`}
                    >
                      {title}
                    </h1>

                    {description && (
                      <p className="mt-4 max-w-[430px] text-sm leading-7 text-[#526058] sm:text-base sm:leading-8">
                        {
                          description
                        }
                      </p>
                    )}

                    <Link
                      href={
                        slide.link_url ||
                        "/products"
                      }
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg"
                    >
                      <span>
                        {
                          buttonText
                        }
                      </span>

                      {isArabic ? (
                        <ArrowLeft
                          size={
                            17
                          }
                        />
                      ) : (
                        <ArrowRight
                          size={
                            17
                          }
                        />
                      )}
                    </Link>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          );
        }
      )}

      {/* Desktop navigation arrows */}
      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label="Previous banner"
            className="kab-banner-prev absolute left-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center text-[#142019]/70 transition duration-200 hover:text-[#0a583b] md:flex lg:left-7"
          >
            <ChevronLeft
              size={31}
              strokeWidth={1.35}
            />
          </button>

          <button
            type="button"
            aria-label="Next banner"
            className="kab-banner-next absolute right-5 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center text-[#142019]/70 transition duration-200 hover:text-[#0a583b] md:flex lg:right-7"
          >
            <ChevronRight
              size={31}
              strokeWidth={1.35}
            />
          </button>
        </>
      )}
    </Swiper>
  );
}