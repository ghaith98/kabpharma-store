"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ProductSwiper({ products }: { products: any[] }) {
  return (
    <Swiper
      spaceBetween={16}
      slidesPerView={1.25}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {products.map((product) => (
        <SwiperSlide key={product.id}>
          <div className="rounded-3xl bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900">
              {product.name}
            </h3>

            <p className="mt-2 line-clamp-2 text-sm text-gray-600">
              {product.description}
            </p>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}