"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { useLanguage } from "../../../context/LanguageContext";
import "swiper/css";

export default function RelatedProductsSwiper({
  products,
}: {
  products: any[];
}) {
  const { lang } = useLanguage();

  return (
    <Swiper
      dir="ltr"
      spaceBetween={16}
      slidesPerView={1.05}
      watchOverflow
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {products.map((item) => {
        const name =
          lang === "ar"
            ? item.name_ar || item.name
            : item.name_en || item.name;

        const description =
          lang === "ar"
            ? item.description_ar || item.description
            : item.description_en || item.description;

        return (
          <SwiperSlide key={item.id}>
            <Link
              href={`/products/${item.id}`}
              className="block overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="h-44 overflow-hidden bg-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    {lang === "ar" ? "لا توجد صورة" : "No image"}
                  </div>
                )}
              </div>

              <div
                dir={lang === "ar" ? "rtl" : "ltr"}
                className={lang === "ar" ? "p-5 text-right" : "p-5 text-left"}
              >
                <h3 className="text-lg font-bold text-gray-900">{name}</h3>

                <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                  {description}
                </p>

                <p className="mt-4 font-extrabold text-green-700">
                  {Number(item.price).toLocaleString()} SYP
                </p>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}