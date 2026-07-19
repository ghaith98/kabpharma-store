"use client";

import ProductSwiper from "../../ProductSwiper";
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
    <ProductSwiper products={products} />
  );
}