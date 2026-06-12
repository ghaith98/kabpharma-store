"use client";

import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = images[selectedIndex];

  function goPrevious() {
    setSelectedIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  }

  function goNext() {
    setSelectedIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-gray-100">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={productName}
            className="w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="flex h-80 items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={goPrevious}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white hover:text-green-700"
              aria-label="Previous image"
            >
              <FaChevronLeft size={18} />
            </button>

            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white hover:text-green-700"
              aria-label="Next image"
            >
              <FaChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                selectedIndex === index
                  ? "border-green-600"
                  : "border-gray-200"
              }`}
            >
              <img
                src={image}
                alt={`${productName} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}