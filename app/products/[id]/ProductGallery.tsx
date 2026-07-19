"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProductGallery({
  images,
  productName,
  backLabel,
}: {
  images: string[];
  productName: string;
  backLabel: string;
}) {
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const selectedImage =
    images[selectedIndex] || images[0];

  function goPrevious() {
    setSelectedIndex((current) =>
      current === 0
        ? images.length - 1
        : current - 1
    );
  }

  function goNext() {
    setSelectedIndex((current) =>
      current === images.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <div className="min-w-0">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f7f8f6]">
        <Link
  href="/products"
  aria-label={backLabel}
  className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center border border-[#dfe4e0] bg-white/95 text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:left-4 sm:top-4 sm:h-11 sm:w-11"
>
  <ArrowLeft
    size={19}
    strokeWidth={1.8}
  />
</Link>
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 56vw"
            className="h-full w-full object-contain p-4 transition duration-500 sm:p-8 lg:p-10"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#909991]">
            No image
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#dfe4e0] bg-white/95 text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:left-4 sm:h-11 sm:w-11"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#dfe4e0] bg-white/95 text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:right-4 sm:h-11 sm:w-11"
            >
              <ChevronRight size={19} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 border border-[#dfe4e0] bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#526057] sm:bottom-4 sm:right-4">
            {selectedIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => {
            const selected =
              selectedIndex === index;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() =>
                  setSelectedIndex(index)
                }
                aria-label={`View product image ${
                  index + 1
                }`}
                className={`h-[72px] w-[72px] shrink-0 overflow-hidden border bg-[#f7f8f6] transition sm:h-20 sm:w-20 ${
                  selected
                    ? "border-[#0a583b] ring-1 ring-[#0a583b]"
                    : "border-[#dfe4e0] hover:border-[#8c978f]"
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  width={96}
                  height={96}
                  sizes="96px"
                  className="h-full w-full object-contain p-1.5"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}