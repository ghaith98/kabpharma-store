"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function HomeBannerSwiper({
  banners,
}: {
  banners: any[];
}) {
  if (!banners || banners.length === 0) return null;

  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{
        delay: 5000,
        disableOnInteraction: false,
      }}
      loop
      slidesPerView={1}
      className="rounded-[2rem]"
    >
      {banners.map((slide) => (
        <SwiperSlide key={slide.id}>
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
            <div className="grid md:grid-cols-2">
              <div className="h-[280px] md:h-[420px]">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex items-center bg-pink-300 p-10">
                <div>
                  <h2 className="text-4xl font-extrabold text-black">
                    {slide.title}
                  </h2>

                  <p className="mt-6 text-lg leading-8 text-black/80">
                    {slide.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}