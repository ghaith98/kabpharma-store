"use client";

import Image from "next/image";
import Link from "next/link";

import type { ConcernWithProducts } from "@/lib/concerns";

type CategoryShowcaseProps = {
  concerns?: ConcernWithProducts[];
  lang: "en" | "ar";
};

const MAX_VISIBLE_CONCERNS = 8;

export default function CategoryShowcase({
  concerns = [],
  lang,
}: CategoryShowcaseProps) {
  const isArabic = lang === "ar";

  const labelFor = (concern: ConcernWithProducts) =>
    (isArabic
      ? concern.name_ar || concern.name_en
      : concern.name_en || concern.name_ar) || null;

  const visibleConcerns = concerns
    .filter(
      (concern) =>
        concern.image_url &&
        concern.productIds.length > 0 &&
        labelFor(concern)
    )
    .slice(0, MAX_VISIBLE_CONCERNS);

  if (visibleConcerns.length === 0) {
    return null;
  }

  const heading = isArabic
    ? "تسوّق حسب الحاجة."
    : "Shop by concern.";

  return (
    <section className="border-t border-[#e7ebe8] py-12 sm:py-16">
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"
      >
        <h2
          className={`font-extrabold text-[#142019] ${
            isArabic
              ? "text-2xl [font-family:Tahoma,Arial,sans-serif] sm:text-[28px]"
              : "text-2xl tracking-[-0.02em] sm:text-[28px]"
          }`}
        >
          {heading}
        </h2>

        <div className="kab-hide-scrollbar mt-8 flex gap-6 overflow-x-auto sm:gap-8">
          {visibleConcerns.map((concern) => {
            const label = labelFor(concern) as string;

            const href = `/products?ids=${concern.productIds.join(
              ","
            )}&label=${encodeURIComponent(label)}`;

            return (
              <Link
                key={concern.id}
                href={href}
                className="group flex w-[104px] shrink-0 flex-col items-center text-center sm:w-[124px]"
              >
                <span className="relative block aspect-square w-full overflow-hidden bg-[#eef1ee]">
                  <Image
                    src={concern.image_url as string}
                    alt=""
                    fill
                    sizes="124px"
                    className="object-cover transition-opacity duration-200 group-hover:opacity-85"
                  />
                </span>

                <span className="mt-3 text-[13px] font-medium leading-snug text-[#142019]">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
