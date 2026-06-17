"use client";

import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
import ProductGallery from "./ProductGallery";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductDetailsClient({
  product,
  galleryImages,
  finalPrice,
  originalPrice,
  salePercent,
}: {
  product: any;
  galleryImages: string[];
  finalPrice: number;
  originalPrice: number;
  salePercent: number;
}) {
  const { lang } = useLanguage();

  const productName =
    lang === "ar" ? product.name_ar || product.name : product.name_en || product.name;

  const productDescription =
    lang === "ar"
      ? product.description_ar || product.description
      : product.description_en || product.description;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductGallery images={galleryImages} productName={productName} />

      <div dir={lang === "ar" ? "rtl" : "ltr"} className={lang === "ar" ? "text-right" : "text-left"}>
        <h1 className="text-4xl font-extrabold text-gray-900">{productName}</h1>

        <p className="mt-6 leading-8 text-gray-700">{productDescription}</p>

        {product.is_out_of_stock ? (
          <>
            <div className="mt-6">
              {salePercent > 0 && (
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white">
                    -{salePercent}%
                  </span>

                  <span className="text-lg font-bold text-gray-400 line-through">
                    {originalPrice.toLocaleString()} SYP
                  </span>
                </div>
              )}

              <p className="text-3xl font-extrabold text-green-700">
                {Math.round(finalPrice).toLocaleString()} SYP
              </p>
            </div>

            <button
              disabled
              className="mt-8 w-full cursor-not-allowed rounded-2xl bg-gray-200 py-3 font-semibold text-gray-500"
            >
              {lang === "ar" ? "غير متوفر" : "Out of Stock"}
            </button>
          </>
        ) : (
          <ProductDetailsAddToCart
            product={{
              id: product.id,
              name: productName,
              price: Math.round(finalPrice),
              original_price: originalPrice,
              sale_percent: salePercent,
              image_url: product.image_url,
            }}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            salePercent={salePercent}
          />
        )}
      </div>
    </div>
  );
}