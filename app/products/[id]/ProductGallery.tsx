    "use client";

import { useState } from "react";

export default function ProductGallery({
  images,
  productName,
}: {
  images: string[];
  productName: string;
}) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-gray-100">
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
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setSelectedImage(image)}
              className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                selectedImage === image
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