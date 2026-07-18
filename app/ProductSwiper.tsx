"use client";

import { useState } from "react";

import type {
  Swiper as SwiperInstance,
} from "swiper";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "swiper/css";

import EditorialProductCard from "./products/EditorialProductCard";
import type {
  EditorialProduct,
} from "./products/EditorialProductCard";

import { useLanguage } from "../context/LanguageContext";

type ProductSwiperProps = {
  products: EditorialProduct[];
  bestSellerIds?: number[];
};

export default function ProductSwiper({
  products,
}: ProductSwiperProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const [
    swiperInstance,
    setSwiperInstance,
  ] = useState<SwiperInstance | null>(
    null
  );

  const [
    canSlidePrevious,
    setCanSlidePrevious,
  ] = useState(false);

  const [
    canSlideNext,
    setCanSlideNext,
  ] = useState(false);

  function updateNavigation(
    swiper: SwiperInstance
  ) {
    setCanSlidePrevious(
      !swiper.isBeginning
    );

    setCanSlideNext(
      !swiper.isEnd
    );
  }

  if (!products?.length) {
    return null;
  }

  return (
    <div className="relative">
      <Swiper
        dir="ltr"
        spaceBetween={14}
        slidesPerView={1.55}
        slidesPerGroup={1}
        watchOverflow
        onSwiper={(swiper) => {
          setSwiperInstance(swiper);

          window.requestAnimationFrame(
            () => {
              swiper.update();
              updateNavigation(swiper);
            }
          );
        }}
        onSlideChange={updateNavigation}
        onResize={updateNavigation}
        onBreakpoint={(swiper) => {
          window.requestAnimationFrame(
            () => {
              swiper.update();
              updateNavigation(swiper);
            }
          );
        }}
        breakpoints={{
          480: {
            slidesPerView: 1.8,
            spaceBetween: 14,
          },
          640: {
            slidesPerView: 2.2,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: 2.6,
            spaceBetween: 18,
          },
          1024: {
            slidesPerView: 3.25,
            spaceBetween: 20,
          },
          1280: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
        }}
        className="!overflow-hidden"
      >
        {products.map((product) => (
          <SwiperSlide
            key={product.id}
            className="h-auto"
          >
            <EditorialProductCard
              product={product}
              headingLevel={3}
              imageSizes="(max-width: 640px) 65vw, (max-width: 1024px) 38vw, 25vw"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {canSlidePrevious && (
        <button
          type="button"
          aria-label={
            isArabic
              ? "المنتجات السابقة"
              : "Previous products"
          }
          onClick={() =>
            swiperInstance?.slidePrev()
          }
          className="absolute left-2 top-[36%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:left-3 sm:h-12 sm:w-12"
        >
          <ChevronLeft
            aria-hidden="true"
            className="h-5 w-5 stroke-[1.8]"
          />
        </button>
      )}

      {canSlideNext && (
        <button
          type="button"
          aria-label={
            isArabic
              ? "المزيد من المنتجات"
              : "Next products"
          }
          onClick={() =>
            swiperInstance?.slideNext()
          }
          className="absolute right-2 top-[36%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:right-3 sm:h-12 sm:w-12"
        >
          <ChevronRight
            aria-hidden="true"
            className="h-5 w-5 stroke-[1.8]"
          />
        </button>
      )}
    </div>
  );
}