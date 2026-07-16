"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { useLanguage } from "../../context/LanguageContext";

type ProductVariant = {
  id: number | string;
  price: number | string;

  label_ar?: string | null;
  label_en?: string | null;

  name_ar?: string | null;
  name_en?: string | null;

  label?: string | null;
  name?: string | null;

  images?: string[] | null;
};

type Product = {
  id: number;
  name: string;

  price: number;
  original_price?: number;
  sale_percent?: number;

  image_url: string | null;
};

export default function AddToCartButton({
  product,
  productVariants = [],
}: {
  product: Product;
  productVariants?: ProductVariant[];
}) {
  const { lang } = useLanguage();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    /*
      أرخص variant هو الخيار الافتراضي،
      مثل 50g في Glucoflex.
    */
    const defaultVariant =
      [...productVariants].sort(
        (first, second) =>
          Number(first.price) -
          Number(second.price)
      )[0] || null;

    const variantLabelAr = defaultVariant
      ? defaultVariant.label_ar ||
        defaultVariant.name_ar ||
        defaultVariant.label ||
        defaultVariant.name ||
        defaultVariant.label_en ||
        defaultVariant.name_en ||
        null
      : null;

    const variantLabelEn = defaultVariant
      ? defaultVariant.label_en ||
        defaultVariant.name_en ||
        defaultVariant.label ||
        defaultVariant.name ||
        defaultVariant.label_ar ||
        defaultVariant.name_ar ||
        null
      : null;

    const selectedLabel =
      lang === "ar"
        ? variantLabelAr
        : variantLabelEn;

    const salePercent = Number(
      product.sale_percent || 0
    );

    /*
      إذا المنتج عنده variants:
      السعر الأساسي يأتي من أرخص variant.
      
      إذا ما عنده variants:
      منحتفظ بالسعر المرسل من Product Card.
    */
    const variantOriginalPrice =
      defaultVariant != null
        ? Number(defaultVariant.price)
        : Number(
            product.original_price ??
              product.price
          );

    const finalPrice =
      defaultVariant != null
        ? salePercent > 0
          ? variantOriginalPrice *
            (1 - salePercent / 100)
          : variantOriginalPrice
        : Number(product.price);

    addToCart({
      id: product.id,

      name: selectedLabel
        ? `${product.name} - ${selectedLabel}`
        : product.name,

      product_name: product.name,

      price: Math.round(finalPrice),

      original_price:
        defaultVariant != null
          ? variantOriginalPrice
          : product.original_price,

      sale_percent: salePercent,

      image_url:
        defaultVariant?.images?.[0] ||
        product.image_url,

      variant_id:
        defaultVariant?.id != null
          ? Number(defaultVariant.id)
          : null,

      variant_label_ar:
        variantLabelAr,

      variant_label_en:
        variantLabelEn,
    });

    window.dispatchEvent(
      new Event("cartUpdated")
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={`w-full rounded-2xl py-3 font-semibold transition duration-300 ${
        added
          ? "bg-green-50 text-green-700 ring-1 ring-green-600"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {added
        ? lang === "ar"
          ? "✓ تمت الإضافة"
          : "✓ Added"
        : lang === "ar"
          ? "أضف إلى السلة"
          : "Add to Cart"}
    </button>
  );
}