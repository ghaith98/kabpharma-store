"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay } from "swiper/modules";
import { useLanguage } from "@/context/LanguageContext";
import type { HomeBanner } from "./HomeBannerSwiper";
import "swiper/css";

export default function BrandsDiscoveryBanner({ banners }: { banners: HomeBanner[] }) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const campaigns = banners.filter((banner) => banner.image_url?.trim());
  if (campaigns.length === 0) return null;

  return (
    <section dir={isArabic ? "rtl" : "ltr"} aria-label={isArabic ? "اكتشف علاماتنا التجارية" : "Discover our other brands"} className="w-full overflow-hidden bg-white">
      <Swiper key={lang} dir={isArabic ? "rtl" : "ltr"} modules={[A11y, Autoplay]} slidesPerView={1} speed={700} rewind={campaigns.length > 1} autoplay={campaigns.length > 1 ? { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true } : false} className="w-full">
        {campaigns.map((banner) => {
          const title = (isArabic ? banner.title_ar || banner.title || banner.title_en : banner.title_en || banner.title || banner.title_ar) || (isArabic ? "اكتشف علاماتنا التجارية" : "Discover our other brands");
          const description = (isArabic ? banner.text_ar || banner.text || banner.text_en : banner.text_en || banner.text || banner.text_ar) || "";
          const buttonText = (isArabic ? banner.button_text_ar || banner.button_text : banner.button_text_en || banner.button_text) || (isArabic ? "اكتشف علاماتنا" : "Explore our brands");
          const showText = banner.show_text !== false;
          const showButton = banner.show_button !== false;
          const href = banner.link_url || "/brands";
          const desktop = getImageProps({ src: banner.image_url!, alt: title, width: 1600, height: 620, sizes: "100vw", quality: 90 }).props;
          const mobile = getImageProps({ src: banner.image_url_mobile || banner.image_url!, alt: title, width: 800, height: 800, sizes: "100vw", quality: 90 }).props;

          return (
            <SwiperSlide key={banner.id}>
              <article className="w-full bg-white">
                {(showText || showButton) && (
                  <div className="mx-auto flex max-w-[760px] flex-col items-center px-5 pb-6 pt-6 text-center sm:px-8 sm:pb-8 sm:pt-8">
                    {showText && <>
                      <h2 className={`max-w-[640px] text-[28px] font-extrabold leading-tight text-[#142019] sm:text-4xl ${isArabic ? "[font-family:var(--font-arabic)]" : "tracking-[-0.025em]"}`}>{title}</h2>
                      {description && <p className="mt-4 max-w-[620px] text-sm leading-7 text-[#647168] sm:text-base">{description}</p>}
                    </>}
                    {showButton && <Link href={href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#142019] bg-white px-7 py-2.5 text-sm font-medium text-[#142019] transition hover:bg-[#142019] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b] focus-visible:ring-offset-4">{buttonText}</Link>}
                  </div>
                )}
                <div className="relative w-full bg-white">
                  <picture className="block w-full">
                    <source media="(min-width: 768px)" srcSet={desktop.srcSet} width={1600} height={620} />
                    <source media="(max-width: 767px)" srcSet={mobile.srcSet} width={800} height={800} />
                    {/* Intrinsic height keeps the complete selected artwork visible.
                        Edge fading blends the studio backdrop into the white page. */}
                    <img {...mobile} alt={title} loading="lazy" fetchPriority="auto" decoding="async" className="kab-brands-discovery-image block h-auto w-full select-none" />
                  </picture>
                  <Link href={href} aria-hidden={showButton ? true : undefined} tabIndex={showButton ? -1 : undefined} aria-label={showButton ? undefined : title} className="absolute inset-0" />
                </div>
              </article>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
