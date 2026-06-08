"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function RelatedProductsSwiper({
  products,
}: {
  products: any[];
}) {
  return (
    <Swiper
      spaceBetween={16}
      slidesPerView={1.25}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {products.map((item) => (
        <SwiperSlide key={item.id}>
          <Link
            href={`/products/${item.id}`}
            className="block overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="h-44 overflow-hidden bg-gray-100">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="text-lg font-bold text-gray-900">
                {item.name}
              </h3>

              <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                {item.description}
              </p>

              <p className="mt-4 font-extrabold text-green-700">
                {Number(item.price).toLocaleString()} SYP
              </p>
            </div>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}