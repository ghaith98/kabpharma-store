"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useLanguage } from "../context/LanguageContext";

import "swiper/css";

export default function HomeBannerSwiper({ banners }: { banners: any[] }) {
  const { lang } = useLanguage();

  if (!banners || banners.length === 0) return null;

  return (
    <Swiper
      dir="ltr"
      modules={[Autoplay]}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      loop
      slidesPerView={1}
      className="rounded-[2rem]"
    >
      {banners.map((slide) => {
        const title =
          lang === "ar"
            ? slide.title_ar || slide.title
            : slide.title_en || slide.title;

        const text =
          lang === "ar"
            ? slide.text_ar || slide.text
            : slide.text_en || slide.text;

        return (
          <SwiperSlide key={slide.id}>
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
              <div className="grid md:grid-cols-2">
                <div className="h-[280px] md:h-[420px]">
                  <img
                    src={slide.image_url}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  className={`flex items-center bg-pink-300 p-10 ${
                    lang === "ar" ? "text-right" : "text-left"
                  }`}
                >
                  <div>
                    <h2 className="text-4xl font-extrabold text-black">
                      {title}
                    </h2>

                    <p className="mt-6 text-lg leading-8 text-black/80">
                      {text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}