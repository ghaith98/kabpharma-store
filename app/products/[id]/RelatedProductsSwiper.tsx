"use client";

import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useLanguage } from "../../../context/LanguageContext";

import "swiper/css";

export default function RelatedProductsSwiper({
  products,
}: {
  products: any[];
}) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <Swiper
      dir="ltr"
      spaceBetween={14}
      slidesPerView={1.2}
      watchOverflow
      breakpoints={{
        480: {
          slidesPerView: 1.55,
          spaceBetween: 14,
        },
        640: {
          slidesPerView: 2.1,
          spaceBetween: 16,
        },
        900: {
          slidesPerView: 3,
          spaceBetween: 20,
        },
      }}
      className="!overflow-visible"
    >
      {products.map((item) => {
        const name = isArabic
          ? item.name_ar || item.name || item.name_en
          : item.name_en || item.name || item.name_ar;

        const description = isArabic
          ? item.description_ar ||
            item.description ||
            item.description_en
          : item.description_en ||
            item.description ||
            item.description_ar;

        const salePercent = Math.min(
          100,
          Math.max(0, Number(item.sale_percent || 0))
        );

        const originalPrice = Number(item.price || 0);

        const finalPrice =
          salePercent > 0
            ? originalPrice -
              originalPrice * (salePercent / 100)
            : originalPrice;

        const isOutOfStock = Boolean(item.is_out_of_stock);

        return (
  <SwiperSlide key={item.id} className="h-auto">
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className="group flex h-[370px] flex-col overflow-hidden rounded-[1.5rem] border border-[#e7ebe8] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#d7e5dc] hover:shadow-xl hover:shadow-[#073f2c]/[0.06]"
    >
      <Link
        href={`/products/${item.id}`}
        aria-label={name}
        className="relative block h-[215px] shrink-0 overflow-hidden bg-[#f7f8f6]"
      >
        <div className="flex h-full w-full items-center justify-center p-5 sm:p-6">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={name}
              width={600}
              height={600}
              sizes="(max-width: 640px) 82vw, (max-width: 900px) 48vw, 33vw"
              className={`h-full w-full object-contain transition duration-500 group-hover:scale-[1.04] ${
                isOutOfStock
                  ? "opacity-55 grayscale-[25%]"
                  : ""
              }`}
            />
          ) : (
            <span className="text-sm font-bold text-[#99a29c]">
              {isArabic ? "لا توجد صورة" : "No image"}
            </span>
          )}
        </div>

        <div
          dir={isArabic ? "rtl" : "ltr"}
          className={`absolute top-3 flex flex-col items-start gap-2 ${
            isArabic ? "right-3" : "left-3"
          }`}
        >
          {isOutOfStock ? (
            <span className="rounded-full border border-[#dfe4e0] bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-[#526057] shadow-sm backdrop-blur">
              {isArabic ? "غير متوفر" : "Out of stock"}
            </span>
          ) : salePercent > 0 ? (
            <span className="rounded-full border border-red-100 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-red-600 shadow-sm backdrop-blur">
              -{salePercent}%
            </span>
          ) : null}
        </div>
      </Link>

      <div
        className={`flex flex-1 flex-col p-4 sm:p-5 ${
          isArabic ? "text-right" : "text-left"
        }`}
      >
        <Link href={`/products/${item.id}`}>
          <h3 className="line-clamp-2 min-h-[48px] text-[15px] font-extrabold leading-6 text-[#142019] transition group-hover:text-[#0a583b] sm:text-base">
            {name}
          </h3>
        </Link>

        <p
          className={`mt-1 line-clamp-1 min-h-5 text-xs leading-5 text-[#647168] ${
            description ? "visible" : "invisible"
          }`}
        >
          {description || "Product description"}
        </p>

        <div className="mt-auto flex min-h-[45px] items-end justify-between gap-3 pt-2">
          <div className="flex min-h-[41px] min-w-0 flex-col justify-end">
            <p
              className={`whitespace-nowrap text-base font-extrabold ${
                salePercent > 0
                  ? "text-red-600"
                  : "text-[#0a583b]"
              }`}
            >
              {Math.round(finalPrice).toLocaleString()} SYP
            </p>

            <p
              aria-hidden={salePercent <= 0}
              className={`mt-1 whitespace-nowrap text-[11px] font-bold text-[#99a29c] line-through ${
                salePercent > 0 ? "visible" : "invisible"
              }`}
            >
              {originalPrice.toLocaleString()} SYP
            </p>
          </div>

          <Link
            href={`/products/${item.id}`}
            aria-label={
              isArabic ? `عرض ${name}` : `View ${name}`
            }
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white"
          >
            {isArabic ? (
              <FiArrowLeft />
            ) : (
              <FiArrowRight />
            )}
          </Link>
        </div>
      </div>
    </article>
  </SwiperSlide>
);
      })}
    </Swiper>
  );
}
