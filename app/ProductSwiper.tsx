"use client";

import {
  useState,
} from "react";

import type {
  Swiper as SwiperInstance,
} from "swiper";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import Image from "next/image";
import Link from "next/link";

import "swiper/css";

import WishlistButton from "./products/WishlistButton";

import type {
  ProductCardProduct,
} from "./products/ProductCard";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

type ProductSwiperProps = {
  products: ProductCardProduct[];
  bestSellerIds?: number[];
};

export default function ProductSwiper({
  products,
}: ProductSwiperProps) {
  const { lang } =
    useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const [
    swiperInstance,
    setSwiperInstance,
  ] =
    useState<SwiperInstance | null>(
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

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <h3 className="text-lg font-extrabold text-gray-900">
          {currentLang === "ar"
            ? "لا توجد منتجات حالياً"
            : "No products available yet"}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {currentLang === "ar"
            ? "ستظهر المنتجات هنا بعد إضافتها."
            : "Products will appear here once added."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Swiper
        dir="ltr"
        spaceBetween={14}
        slidesPerView={1.22}
        slidesPerGroup={1}
        watchOverflow
        onSwiper={(swiper) => {
          setSwiperInstance(
            swiper
          );

          window.requestAnimationFrame(
            () => {
              swiper.update();

              updateNavigation(
                swiper
              );
            }
          );
        }}
        onSlideChange={(
          swiper
        ) => {
          updateNavigation(
            swiper
          );
        }}
        onResize={(swiper) => {
          updateNavigation(
            swiper
          );
        }}
        onBreakpoint={(
          swiper
        ) => {
          window.requestAnimationFrame(
            () => {
              swiper.update();

              updateNavigation(
                swiper
              );
            }
          );
        }}
        breakpoints={{
          480: {
            slidesPerView: 1.65,
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
            slidesPerView: 3,
            spaceBetween: 20,
          },

          1280: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
        }}
        className="!overflow-hidden"
      >
        {products.map(
          (product) => {
            const salePercent =
              Math.min(
                100,
                Math.max(
                  0,
                  Number(
                    product.sale_percent ||
                      0
                  )
                )
              );

            const originalPrice =
              Number(
                product.price || 0
              );

            const finalPrice =
              salePercent > 0
                ? originalPrice -
                  originalPrice *
                    (salePercent /
                      100)
                : originalPrice;

            const productName =
              (
                currentLang === "ar"
                  ? product.name_ar ||
                    product.name ||
                    product.name_en
                  : product.name_en ||
                    product.name ||
                    product.name_ar
              ) ||
              (
                currentLang === "ar"
                  ? "منتج كاب فارما"
                  : "KAB Pharma product"
              );

            const productDescription =
              (
                currentLang === "ar"
                  ? product.description_ar ||
                    product.description ||
                    product.description_en
                  : product.description_en ||
                    product.description ||
                    product.description_ar
              ) || "";

            return (
              <SwiperSlide
                key={product.id}
                className="h-auto"
              >
                <article
                  dir={
                    currentLang ===
                    "ar"
                      ? "rtl"
                      : "ltr"
                  }
                  className="group flex h-[390px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-100 hover:shadow-xl hover:shadow-green-950/5"
                >
                  <div className="relative h-[218px] shrink-0 overflow-hidden bg-[#f7f8f7]">
                    <Link
                      href={`/products/${product.id}`}
                      aria-label={
                        productName
                      }
                      className="flex h-full w-full items-center justify-center p-4"
                    >
                      {product.image_url ? (
                        <Image
                          src={
                            product.image_url
                          }
                          alt={
                            productName
                          }
                          width={600}
                          height={600}
                          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 25vw"
                          className={`h-full w-full object-contain transition duration-500 group-hover:scale-[1.04] ${
                            product.is_out_of_stock
                              ? "opacity-60 grayscale-[20%]"
                              : ""
                          }`}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-400">
                          {currentLang ===
                          "ar"
                            ? "لا توجد صورة"
                            : "No image"}
                        </div>
                      )}
                    </Link>

                    <div
                      dir="ltr"
                      className="absolute right-3 top-3 z-20"
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <WishlistButton
                        product={{
                          id:
                            product.id,

                          name:
                            productName,

                          price:
                            Math.round(
                              finalPrice
                            ),

                          original_price:
                            originalPrice,

                          sale_percent:
                            salePercent,

                          image_url:
                            product.image_url ||
                            "",
                        }}
                      />
                    </div>

                    <div
                      dir={
                        currentLang ===
                        "ar"
                          ? "rtl"
                          : "ltr"
                      }
                      className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2"
                    >
                      {product.is_out_of_stock ? (
                        <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[10px] font-extrabold text-gray-700 shadow-sm backdrop-blur">
                          {currentLang ===
                          "ar"
                            ? "غير متوفر"
                            : "Out of stock"}
                        </span>
                      ) : salePercent >
                        0 ? (
                        <span className="rounded-full border border-red-100 bg-white px-3 py-1.5 text-[10px] font-extrabold text-red-600 shadow-sm backdrop-blur">
                          -{salePercent}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`flex flex-1 flex-col p-4 sm:p-5 ${
                      currentLang ===
                      "ar"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <Link
                      href={`/products/${product.id}`}
                    >
                      <h3 className="line-clamp-2 min-h-[48px] text-[15px] font-extrabold leading-6 text-gray-950 transition group-hover:text-green-700 sm:text-base">
                        {productName}
                      </h3>
                    </Link>

                    {productDescription && (
                      <p className="mt-1.5 line-clamp-1 text-xs leading-5 text-gray-500 sm:text-sm">
                        {productDescription}
                      </p>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <p
                            className={`whitespace-nowrap text-base font-extrabold ${
                              salePercent >
                              0
                                ? "text-red-600"
                                : "text-green-700"
                            }`}
                          >
                            {Math.round(
                              finalPrice
                            ).toLocaleString()}{" "}
                            SYP
                          </p>

                          {salePercent >
                            0 && (
                            <p className="whitespace-nowrap text-[11px] font-bold text-gray-400 line-through">
                              {originalPrice.toLocaleString()}{" "}
                              SYP
                            </p>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-green-50 px-3 text-xs font-extrabold text-green-700 transition hover:bg-green-700 hover:text-white"
                      >
                        {currentLang ===
                        "ar"
                          ? "عرض"
                          : "View"}
                      </Link>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            );
          }
        )}
      </Swiper>

      {/* Previous arrow */}
{canSlidePrevious && (
  <button
    type="button"
    aria-label={
      currentLang === "ar"
        ? "المنتجات السابقة"
        : "Previous products"
    }
    onClick={() => {
      swiperInstance?.slidePrev();
    }}
    className="absolute left-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] bg-white transition hover:border-[#cdd6d0] hover:bg-white sm:left-3 sm:h-14 sm:w-14"
  >
    <ChevronLeft
      aria-hidden="true"
      className="h-5 w-5 stroke-[1.8] sm:h-6 sm:w-6"
    />
  </button>
)}

{/* Next arrow */}
{canSlideNext && (
  <button
    type="button"
    aria-label={
      currentLang === "ar"
        ? "المزيد من المنتجات"
        : "Next products"
    }
    onClick={() => {
      swiperInstance?.slideNext();
    }}
    className="absolute right-2 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#142019] shadow-[0_8px_24px_rgba(20,32,25,0.12)] backdrop-blur-sm transition hover:border-[#cdd6d0] hover:bg-white sm:right-3 sm:h-14 sm:w-14"
  >
    <ChevronRight
      aria-hidden="true"
      className="h-5 w-5 stroke-[1.8] sm:h-6 sm:w-6"
    />
  </button>
)}
    </div>
  );
}