"use client";

import ProductSwiper from "../../ProductSwiper";
import { RELATED_PRODUCT_SWIPER_SIZES } from "@/lib/image-sizes";
import type {
  EditorialProduct,
} from "../EditorialProductCard";

export default function RelatedProductsSwiper({
  products,
}: {
  products: EditorialProduct[];
}) {
  if (!products?.length) {
    return null;
  }

  return (
    <ProductSwiper products={products} imageSizes={RELATED_PRODUCT_SWIPER_SIZES} />
  );
}