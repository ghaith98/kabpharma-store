"use client";

import {
  useRef,
  useState,
  type CSSProperties,
} from "react";

import Link from "next/link";
import { getImageProps } from "next/image";
import type { Swiper as SwiperInstance } from "swiper";

import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  Autoplay,
  Navigation,
} from "swiper/modules";

import { useLanguage } from "../context/LanguageContext";

import "swiper/css";
import "swiper/css/navigation";

type CropMode =
  | "desktop"
  | "mobile";

export type HomeBanner = {
  id: number | string;

  image_url?:
    | string
    | null;

  image_url_mobile?:
    | string
    | null;

  title?:
    | string
    | null;

  title_ar?:
    | string
    | null;

  title_en?:
    | string
    | null;

  text?:
    | string
    | null;

  text_ar?:
    | string
    | null;

  text_en?:
    | string
    | null;

  button_text?:
    | string
    | null;

  button_text_ar?:
    | string
    | null;

  button_text_en?:
    | string
    | null;

  link_url?:
    | string
    | null;

  desktop_position_x?:
    | number
    | string
    | null;

  desktop_position_y?:
    | number
    | string
    | null;

  desktop_zoom?:
    | number
    | string
    | null;

  mobile_position_x?:
    | number
    | string
    | null;

  mobile_position_y?:
    | number
    | string
    | null;

  mobile_zoom?:
    | number
    | string
    | null;
};

type RenderableHomeBanner =
  HomeBanner & {
    image_url: string;
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

function getCropStyle(
  slide: HomeBanner,
  mode: CropMode
): CSSProperties {
  const positionX =
    clamp(
      mode === "desktop"
        ? slide.desktop_position_x
        : slide.mobile_position_x,
      0,
      100,
      50
    );

  const positionY =
    clamp(
      mode === "desktop"
        ? slide.desktop_position_y
        : slide.mobile_position_y,
      0,
      100,
      50
    );

  const zoom =
    clamp(
      mode === "desktop"
        ? slide.desktop_zoom
        : slide.mobile_zoom,
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

type HomeBannerSwiperProps = {
  banners: HomeBanner[];
};

export default function HomeBannerSwiper({
  banners,
}: HomeBannerSwiperProps) {
  const swiperRef =
    useRef<SwiperInstance | null>(
      null
    );

  const [
    activeBannerIndex,
    setActiveBannerIndex,
  ] = useState(0);

  const { lang } =
    useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const isArabic =
    currentLang === "ar";

  const renderableBanners =
    banners.filter(
      (
        banner
      ): banner is RenderableHomeBanner =>
        typeof banner.image_url ===
          "string" &&
        banner.image_url.trim()
          .length > 0
    );

  const hasMultipleBanners =
    renderableBanners.length >
    1;

  if (
    renderableBanners.length ===
    0
  ) {
    return null;
  }

  /*
   * Use one visual copy at each edge instead of Swiper's internal loop.
   * Once an edge copy finishes moving into view, we jump to its matching
   * real slide with a zero-duration transition. The image and content are
   * identical, so the reset is invisible and both swipe directions stay
   * available at the first and last real banners.
   */
  const carouselBanners =
    hasMultipleBanners
      ? [
          renderableBanners[
            renderableBanners.length -
              1
          ]!,
          ...renderableBanners,
          renderableBanners[0]!,
        ]
      : renderableBanners;

  const realBannerCount =
    renderableBanners.length;

  const getRealBannerIndex = (
    carouselIndex: number
  ) => {
    if (
      !hasMultipleBanners
    ) {
      return 0;
    }

    if (carouselIndex === 0) {
      return (
        realBannerCount - 1
      );
    }

    if (
      carouselIndex ===
      realBannerCount + 1
    ) {
      return 0;
    }

    return carouselIndex - 1;
  };

  return (
    <Swiper
      dir="ltr"
      modules={[
        Autoplay,
        Navigation,
      ]}
      slidesPerView={1}
      slidesPerGroup={1}
      initialSlide={
        hasMultipleBanners
          ? 1
          : 0
      }
      speed={700}
      threshold={4}
      resistance={false}
      roundLengths
      allowSlideNext
      allowSlidePrev
      allowTouchMove
      oneWayMovement={false}
      lazyPreloadPrevNext={1}
      loop={false}
      onSwiper={(swiper) => {
        swiperRef.current =
          swiper;

        setActiveBannerIndex(
          getRealBannerIndex(
            swiper.activeIndex
          )
        );
      }}
      onSlideChange={(
        swiper
      ) => {
        setActiveBannerIndex(
          getRealBannerIndex(
            swiper.activeIndex
          )
        );
      }}
      onTransitionEnd={(
        swiper
      ) => {
        if (
          !hasMultipleBanners
        ) {
          return;
        }

        if (
          swiper.activeIndex ===
          0
        ) {
          swiper.slideTo(
            realBannerCount,
            0,
            false
          );
        } else if (
          swiper.activeIndex ===
          realBannerCount + 1
        ) {
          swiper.slideTo(
            1,
            0,
            false
          );
        }
      }}
      autoplay={
        hasMultipleBanners
          ? {
              delay: 6000,

              disableOnInteraction:
                false,

              pauseOnMouseEnter:
                true,

              waitForTransition:
                true,
            }
          : false
      }
      navigation={
        hasMultipleBanners
          ? {
              nextEl:
                ".kab-banner-next",
            }
          : false
      }
      className="kab-campaign-swiper relative m-0 block w-full max-w-none overflow-hidden"
    >
      {carouselBanners.map(
        (
          slide,
          carouselIndex
        ) => {
          const title =
            (
              isArabic
                ? slide.title_ar ||
                  slide.title ||
                  slide.title_en
                : slide.title_en ||
                  slide.title ||
                  slide.title_ar
            ) ||
            (
              isArabic
                ? "كاب فارما"
                : "KAB Pharma"
            );

          const description =
            (
              isArabic
                ? slide.text_ar ||
                  slide.text ||
                  slide.text_en
                : slide.text_en ||
                  slide.text ||
                  slide.text_ar
            ) || "";

          const buttonText =
            isArabic
              ? slide.button_text_ar ||
                slide.button_text ||
                "اكتشف المنتج"
              : slide.button_text_en ||
                slide.button_text ||
                "Discover product";

          const mobileImage =
            slide.image_url_mobile ||
            slide.image_url;

          const mobileCrop = getCropStyle(slide, "mobile");
          const desktopCrop = getCropStyle(slide, "desktop");

          const cropVariables = {
            "--mobile-object-position": mobileCrop.objectPosition,
            "--mobile-transform": mobileCrop.transform,
            "--mobile-transform-origin": mobileCrop.transformOrigin,
            "--desktop-object-position": desktopCrop.objectPosition,
            "--desktop-transform": desktopCrop.transform,
            "--desktop-transform-origin": desktopCrop.transformOrigin,
          } as CSSProperties;

          const {
            props: {
              srcSet: desktopSrcSet,
            },
          } = getImageProps({
            src: slide.image_url,
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

          const shouldPrioritize =
            hasMultipleBanners
              ? carouselIndex ===
                1
              : carouselIndex ===
                0;

          return (
            <SwiperSlide
              key={`${slide.id}-${carouselIndex}`}
              className="w-full"
            >
              <article
                dir={
                  isArabic
                    ? "rtl"
                    : "ltr"
                }
                className="relative w-full overflow-hidden bg-white md:min-h-[560px] md:bg-[#f6f6f3] lg:min-h-[620px]"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#f6f6f3] md:absolute md:inset-0 md:aspect-auto md:h-full md:min-h-[560px] md:max-h-none">
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
                      "KAB Pharma campaign"
                    }
                    loading={shouldPrioritize ? "eager" : "lazy"}
                    fetchPriority={shouldPrioritize ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    style={cropVariables}
                    className="kab-home-banner-image absolute inset-0 h-full w-full select-none object-cover"
                  />
                  </picture>

                  <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-white/25 via-transparent to-transparent md:block" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-[1440px] px-5 pb-7 pt-5 sm:px-8 sm:pb-8 md:min-h-[560px] md:items-center md:px-12 md:py-10 lg:min-h-[620px] lg:px-16">
                  <div
                    dir={
                      isArabic
                        ? "rtl"
                        : "ltr"
                    }
                    className={`flex min-h-[220px] w-full max-w-[490px] flex-col md:ml-0 md:mr-auto md:min-h-0 md:w-[46%] md:block ${
                      isArabic
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <h1
                      className={`max-w-[440px] text-[30px] font-extrabold leading-[1.18] text-[#142019] sm:text-4xl md:text-[44px] lg:text-[52px] ${
                        isArabic
                          ? "tracking-normal [font-family:var(--font-arabic)]"
                          : "leading-[1.08] tracking-[-0.035em]"
                      }`}
                    >
                      {title}
                    </h1>

                    {description && (
                      <p className="mt-4 max-w-[430px] text-sm leading-7 text-[#526058] sm:text-base sm:leading-8">
                        {description}
                      </p>
                    )}

                    <Link
                      href={
                        slide.link_url ||
                        "/products"
                      }
                      className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-[#292929] bg-white px-6 py-2.5 text-sm font-extrabold text-[#242124] shadow-none transition duration-300 hover:bg-[#f6f6f3] sm:w-auto md:mt-6 md:min-h-12 md:border-0 md:bg-[#0a583b] md:py-3 md:text-white md:shadow-sm md:hover:-translate-y-0.5 md:hover:bg-[#073f2c] md:hover:shadow-lg"
                    >
                      <span>
                        {buttonText}
                      </span>

                      {isArabic ? (
                        <ArrowLeft
                          size={17}
                          className="hidden md:block"
                        />
                      ) : (
                        <ArrowRight
                          size={17}
                          className="hidden md:block"
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

      {hasMultipleBanners && (
        <button
          type="button"
          aria-label={
            isArabic
              ? "عرض البانر التالي"
              : "Show next banner"
          }
          className="kab-banner-next absolute right-3 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] transition hover:border-[#cdd6d0] hover:bg-white md:flex lg:right-8"
        >
          <ChevronRight
            aria-hidden="true"
            className="h-6 w-6 stroke-[1.8]"
          />
        </button>
      )}

      {hasMultipleBanners && (
        <div
          className="kab-banner-pagination"
          role="group"
          aria-label={
            isArabic
              ? "اختيار البانر"
              : "Choose banner"
          }
        >
          {renderableBanners.map(
            (slide, index) => {
              const isActive =
                activeBannerIndex ===
                index;

              return (
                <button
                  key={`pagination-${slide.id}-${index}`}
                  type="button"
                  aria-label={
                    isArabic
                      ? `عرض البانر ${index + 1}`
                      : `Show banner ${index + 1}`
                  }
                  aria-current={
                    isActive
                      ? "true"
                      : undefined
                  }
                  onClick={() => {
                    swiperRef.current?.slideTo(
                      hasMultipleBanners
                        ? index + 1
                        : index
                    );
                  }}
                  className={`kab-banner-pagination-dot ${
                    isActive
                      ? "is-active"
                      : ""
                  }`}
                />
              );
            }
          )}
        </div>
      )}
    </Swiper>
  );
}
