"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { getImageProps } from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useLanguage } from "../context/LanguageContext";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type CropMode = "desktop" | "mobile";

export type HomeBanner = {
  id: number | string;
  image_url?: string | null;
  image_url_mobile?: string | null;
  title?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  text?: string | null;
  text_ar?: string | null;
  text_en?: string | null;
  button_text?: string | null;
  button_text_ar?: string | null;
  button_text_en?: string | null;
  link_url?: string | null;
  desktop_position_x?: number | string | null;
  desktop_position_y?: number | string | null;
  desktop_zoom?: number | string | null;
  mobile_position_x?: number | string | null;
  mobile_position_y?: number | string | null;
  mobile_zoom?: number | string | null;
};

type RenderableHomeBanner = HomeBanner & { image_url: string };

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(maximum, Math.max(minimum, n));
}

function getCropStyle(slide: HomeBanner, mode: CropMode): CSSProperties {
  const positionX = clamp(mode === "desktop" ? slide.desktop_position_x : slide.mobile_position_x, 0, 100, 50);
  const positionY = clamp(mode === "desktop" ? slide.desktop_position_y : slide.mobile_position_y, 0, 100, 50);
  const zoom = clamp(mode === "desktop" ? slide.desktop_zoom : slide.mobile_zoom, 1, 1.6, 1);
  return {
    objectPosition: `${positionX}% ${positionY}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${positionX}% ${positionY}%`,
  };
}

type HomeBannerSwiperProps = { banners: HomeBanner[] };

export default function HomeBannerSwiper({ banners }: HomeBannerSwiperProps) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const renderableBanners = banners.filter(
    (banner): banner is RenderableHomeBanner =>
      typeof banner.image_url === "string" && banner.image_url.trim().length > 0
  );

  const hasMultipleBanners = renderableBanners.length > 1;

  if (renderableBanners.length === 0) return null;

  return (
    <Swiper
      dir="ltr"
      modules={[Autoplay, Navigation, Pagination]}
      slidesPerView={1}
      loop
      speed={300}
      resistance={false}
      touchRatio={1.5}
      shortSwipes
      threshold={5}
      grabCursor
      autoplay={
        hasMultipleBanners
          ? { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }
          : false
      }
      navigation={
        hasMultipleBanners
          ? { nextEl: ".kab-banner-next", prevEl: ".kab-banner-prev" }
          : false
      }
      pagination={hasMultipleBanners ? { clickable: true } : false}
      className="kab-campaign-swiper relative m-0 block w-full max-w-none overflow-hidden"
    >
      {renderableBanners.map((slide, index) => {
        const title =
          (isArabic
            ? slide.title_ar || slide.title || slide.title_en
            : slide.title_en || slide.title || slide.title_ar) ||
          (isArabic ? "كاب فارما" : "KAB Pharma");

        const description =
          (isArabic
            ? slide.text_ar || slide.text || slide.text_en
            : slide.text_en || slide.text || slide.text_ar) || "";

        const buttonText = isArabic
          ? slide.button_text_ar || slide.button_text || "اكتشف المنتج"
          : slide.button_text_en || slide.button_text || "Discover product";

        const mobileImage = slide.image_url_mobile || slide.image_url;
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

        const { props: { srcSet: desktopSrcSet } } = getImageProps({
          src: slide.image_url,
          alt: title,
          width: 1600,
          height: 620,
          sizes: "100vw",
        });

        const { props: { srcSet: mobileSrcSet, ...responsiveImageProps } } = getImageProps({
          src: mobileImage,
          alt: title,
          width: 393,
          height: 680,
          sizes: "100vw",
        });

        return (
          <SwiperSlide key={slide.id} className="w-full">
            <article
              dir={isArabic ? "rtl" : "ltr"}
              className="relative w-full overflow-hidden bg-white md:min-h-[560px] md:bg-[#f6f6f3] lg:min-h-[620px]"
            >
              <div className="relative h-[400px] w-full overflow-hidden bg-[#f6f6f3] md:absolute md:inset-0 md:h-full md:min-h-[560px] md:max-h-none">
                <picture className="absolute inset-0 block h-full w-full overflow-hidden">
                  <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
                  <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
                  <img
                    {...responsiveImageProps}
                    alt={title || "KAB Pharma campaign"}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    style={cropVariables}
                    className="kab-home-banner-image absolute inset-0 h-full w-full select-none object-cover will-change-transform"
                  />
                </picture>
                <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-white/25 via-transparent to-transparent md:block" />
              </div>

              <div className="relative z-10 mx-auto flex w-full max-w-[1440px] px-5 pb-7 pt-8 sm:px-8 sm:pb-8 md:min-h-[560px] md:items-center md:px-12 md:py-10 lg:min-h-[620px] lg:px-16">
                <div
                  dir={isArabic ? "rtl" : "ltr"}
                  className={`flex min-h-[220px] w-full max-w-[490px] flex-col md:ml-0 md:mr-auto md:min-h-0 md:w-[46%] md:block ${
                    isArabic ? "text-right" : "text-left"
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
                    href={slide.link_url || "/products"}
                    className="mt-auto inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg sm:w-auto md:mt-6"
                  >
                    <span>{buttonText}</span>
                    {isArabic ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}
                  </Link>
                </div>
              </div>
            </article>

            <style jsx>{`
              :global(.kab-home-banner-image) {
                object-position: var(--mobile-object-position);
                transform: var(--mobile-transform);
                transform-origin: var(--mobile-transform-origin);
              }
              @media (min-width: 768px) {
                :global(.kab-home-banner-image) {
                  object-position: var(--desktop-object-position);
                  transform: var(--desktop-transform);
                  transform-origin: var(--desktop-transform-origin);
                }
              }
            `}</style>
          </SwiperSlide>
        );
      })}

      {hasMultipleBanners && (
        <>
          <button
            type="button"
            aria-label={isArabic ? "عرض البانر السابق" : "Show previous banner"}
            className="kab-banner-prev absolute left-3 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] transition hover:border-[#cdd6d0] md:flex lg:left-8"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6 rotate-180 stroke-[1.8]" />
          </button>
          <button
            type="button"
            aria-label={isArabic ? "عرض البانر التالي" : "Show next banner"}
            className="kab-banner-next absolute right-3 top-1/2 z-30 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] transition hover:border-[#cdd6d0] md:flex lg:right-8"
          >
            <ChevronRight aria-hidden="true" className="h-6 w-6 stroke-[1.8]" />
          </button>
        </>
      )}
    </Swiper>
  );
}