"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Link from "next/link";
import WishlistButton from "./products/WishlistButton";
import { useLanguage } from "../context/LanguageContext";

export default function ProductSwiper({
  products,
  bestSellerIds = [],
}: {
  products: any[];
  bestSellerIds?: number[];
}) {
  const { lang } = useLanguage();

  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <h3 className="text-xl font-bold text-gray-900">
          {lang === "ar" ? "لا توجد منتجات حالياً" : "No featured products yet"}
        </h3>

        <p className="mt-3 text-gray-600">
          {lang === "ar"
            ? "ستظهر المنتجات هنا بعد إضافتها."
            : "Featured products will appear here once added."}
        </p>
      </div>
    );
  }

  return (
    <Swiper
      dir="ltr"
      spaceBetween={20}
      slidesPerView={1.22}
      watchOverflow
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
    >
      {products.map((product) => {
        const salePercent = Number(product.sale_percent || 0);
        const originalPrice = Number(product.price);
        const finalPrice =
          salePercent > 0
            ? originalPrice - originalPrice * (salePercent / 100)
            : originalPrice;

        const productName =
          lang === "ar"
            ? product.name_ar || product.name
            : product.name_en || product.name;

        const productDescription =
          lang === "ar"
            ? product.description_ar || product.description
            : product.description_en || product.description;

        return (
          <SwiperSlide key={product.id}>
            <Link
              href={`/products/${product.id}`}
              className="group block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-b from-white to-gray-100">
                <div className="absolute right-4 top-4 z-20">
                  <WishlistButton
                    product={{
                      id: product.id,
                      name: productName,
                      price: Math.round(finalPrice),
                      original_price: originalPrice,
                      sale_percent: salePercent,
                      image_url: product.image_url,
                    }}
                  />
                </div>

                {product.is_out_of_stock ? (
                  <span className="absolute left-4 top-4 z-20 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-700 shadow-sm">
                    {lang === "ar" ? "غير متوفر" : "Out of Stock"}
                  </span>
                ) : (
                  salePercent > 0 && (
                    <span className="absolute left-4 top-4 z-20 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600 shadow-sm">
                      -{salePercent}%
                    </span>
                  )
                )}

                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={productName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-gray-400">
                    {lang === "ar" ? "لا توجد صورة" : "No image"}
                  </span>
                )}
              </div>

              <div
                dir={lang === "ar" ? "rtl" : "ltr"}
                className={lang === "ar" ? "p-5 text-right" : "p-5 text-left"}
              >
                <h3 className="line-clamp-2 text-base font-extrabold text-gray-900">
                  {productName}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                  {productDescription}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="min-h-[44px]">
                    <p
                      className={`font-extrabold ${
                        salePercent > 0 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {Math.round(finalPrice).toLocaleString()} SYP
                    </p>

                    <p
                      className={`mt-1 text-xs font-bold ${
                        salePercent > 0
                          ? "text-gray-400 line-through"
                          : "invisible"
                      }`}
                    >
                      {originalPrice.toLocaleString()} SYP
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {lang === "ar" ? "عرض" : "View"}
                  </span>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}