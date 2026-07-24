"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
        labelFor(concern)
    )
    .slice(0, MAX_VISIBLE_CONCERNS);

  if (visibleConcerns.length === 0) {
    return null;
  }

  const heading = isArabic
    ? "تسوّق حسب الحاجة."
    : "Shop by need.";

  const subheading = isArabic
    ? "مش متأكد وين تبدأ؟ هيدي أكتر الحاجات شيوعاً."
    : "Not sure where to begin? Here's a quick way to shop for what you need.";

  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section className="border-t border-[#e7ebe8] py-12 sm:py-16">
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"
      >
        <h2
          className={`font-extrabold text-[#142019] ${
            isArabic
              ? "text-2xl [font-family:var(--font-arabic)] sm:text-[28px]"
              : "text-2xl tracking-[-0.02em] sm:text-[28px]"
          }`}
        >
          {heading}
        </h2>

        <p className="mt-2 text-sm text-[#647168] sm:text-base">
          {subheading}
        </p>

        <div
          dir={isArabic ? "rtl" : "ltr"}
          className="mt-8 grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6"
        >
          {visibleConcerns.map((concern) => {
            const label = labelFor(concern) as string;

            const href = `/shop-by-need/${concern.id}`;

            return (
              <Link
                key={concern.id}
                href={href}
                className="group flex flex-col"
              >
                <span className="relative block aspect-square w-full overflow-hidden bg-[#eef1ee]">
                  <Image
                    src={concern.image_url as string}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                </span>

                <span className="mt-3 flex items-start gap-1.5 text-sm font-bold leading-snug text-[#142019] sm:text-base">
                  <span>{label}</span>

                  <ArrowIcon
                    size={15}
                    className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

