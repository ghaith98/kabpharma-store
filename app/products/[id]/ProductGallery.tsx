"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

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
     <div className="relative flex aspect-square min-h-[360px] items-center justify-center overflow-hidden bg-[#f6f7f5] sm:min-h-[480px] lg:aspect-[4/3] lg:min-h-0">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="h-full w-full object-contain p-6 transition duration-500 sm:p-10 lg:p-10"
          />
        ) : (
          <div className="flex h-full min-h-[400px] items-center justify-center text-sm font-bold text-gray-400">
            No image
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm backdrop-blur transition hover:border-green-200 hover:text-green-700"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm backdrop-blur transition hover:border-green-200 hover:text-green-700"
            >
              <ChevronRight size={19} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-gray-700 shadow-sm backdrop-blur">
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
                className={`h-[76px] w-[76px] shrink-0 overflow-hidden border bg-[#f6f7f5] transition sm:h-20 sm:w-20 ${
                  selected
                    ? "border-[#0a583b] ring-1 ring-[#0a583b]"
                    : "border-gray-200 hover:border-gray-400"
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
