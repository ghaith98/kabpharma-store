"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const slides = [
  {
    image: "/banner1.jpg",
    title: "Skin Repair Solutions",
    text: "Advanced skincare products designed for everyday care.",
  },
  {
    image: "/banner2.jpg",
    title: "Healthy Hair Starts Here",
    text: "Discover our professional hair care collection.",
  },
  {
    image: "/banner3.jpg",
    title: "Sun Protection & Brightening",
    text: "Daily protection for healthier and brighter skin.",
  },
  {
    image: "/banner4.jpg",
    title: "Personal Care Essentials",
    text: "Quality products for your daily routine.",
  },
];

export default function HomeBannerSwiper() {
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
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
            <div className="grid md:grid-cols-2">
              <div className="h-[280px] md:h-[420px]">
                <img
                  src={slide.image}
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