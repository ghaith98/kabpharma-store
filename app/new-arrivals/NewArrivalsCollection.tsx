"use client";

import Link from "next/link";
import { getImageProps } from "next/image";

import EditorialProductCard from "./EditorialProductCard";

import type {
  EditorialProduct,
} from "./EditorialProductCard";

import { useLanguage } from "../../context/LanguageContext";

type DiscoveryBanner = {
  id: number;

  placement:
    | string
    | null;

  image_url:
    | string
    | null;

  image_url_mobile:
    | string
    | null;

  title:
    | string
    | null;

  title_ar:
    | string
    | null;

  title_en:
    | string
    | null;

  text:
    | string
    | null;

  text_ar:
    | string
    | null;

  text_en:
    | string
    | null;

  button_text:
    | string
    | null;

  button_text_ar:
    | string
    | null;

  button_text_en?:
    | string
    | null;

  link_url:
    | string
    | null;
};

function DiscoveryTile({
  banner,
}: {
  banner: DiscoveryBanner;
}) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const title =
    isArabic
      ? banner.title_ar ||
        banner.title ||
        "اكتشف المزيد"
      : banner.title_en ||
        banner.title ||
        "Discover more";

  const description =
    isArabic
      ? banner.text_ar ||
        banner.text ||
        ""
      : banner.text_en ||
        banner.text ||
        "";

  const buttonText =
    isArabic
      ? banner.button_text_ar ||
        banner.button_text ||
        "اكتشف الآن"
      : banner.button_text_en ||
        banner.button_text ||
        "Discover now";

  const imageUrl =
    banner.image_url;

  const mobileImage =
    banner.image_url_mobile ||
    imageUrl;

  if (!imageUrl) {
    return null;
  }

  const {
    props: {
      srcSet: desktopSrcSet,
      ...desktopImageProps
    },
  } = getImageProps({
    src: imageUrl,
    alt: title,
    width: 1080,
    height: 700,
    sizes:
      "(max-width: 1023px) 100vw, 50vw",
    quality: 82,
  });

  const {
    props: {
      srcSet: mobileSrcSet,
    },
  } = getImageProps({
    src: mobileImage || imageUrl,
    alt: title,
    width: 800,
    height: 620,
    sizes: "100vw",
    quality: 82,
  });

  return (
    <article className="h-full">
      <Link
        href={
          banner.link_url ||
          "/products"
        }
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="group flex h-full min-h-[430px] flex-col overflow-hidden border border-[#dfe4e0] bg-white transition sm:min-h-[520px] lg:min-h-[610px]"
      >
        <div className="relative h-[220px] shrink-0 overflow-hidden bg-[#f4f5f3] sm:h-[285px] lg:h-[335px]">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={
                mobileSrcSet
              }
            />

            <source
              media="(min-width: 768px)"
              srcSet={
                desktopSrcSet
              }
            />

            <img
              {...desktopImageProps}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />
          </picture>
        </div>

        <div
          className={`flex flex-1 flex-col bg-white p-5 sm:p-7 lg:p-8 ${
            isArabic
              ? "text-right"
              : "text-left"
          }`}
        >
          <h2 className="text-xl font-extrabold leading-tight text-[#142019] sm:text-2xl">
            {title}
          </h2>

          {description && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#526057] sm:text-[15px]">
              {description}
            </p>
          )}

          <span className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[#0a583b] px-5 text-xs font-extrabold text-[#0a583b] transition group-hover:bg-[#0a583b] group-hover:text-white sm:text-sm">
            {buttonText}
          </span>
        </div>
      </Link>
    </article>
  );
}

type NewArrivalsCollectionProps = {
  products:
    EditorialProduct[];

  discoveryBanners:
    DiscoveryBanner[];
};

export default function NewArrivalsCollection({
  products,
  discoveryBanners,
}: NewArrivalsCollectionProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const firstProducts =
    products.slice(0, 2);

  const middleProducts =
    products.slice(2, 6);

  const secondProducts =
    products.slice(6, 8);

  const remainingProducts =
    products.slice(8);

  const firstDiscovery =
    discoveryBanners.find(
      (banner) =>
        banner.placement ===
        "new_arrivals_discover_1"
    );

  const secondDiscovery =
    discoveryBanners.find(
      (banner) =>
        banner.placement ===
        "new_arrivals_discover_2"
    );

  if (products.length === 0) {
    return (
      <section className="mx-auto flex min-h-[420px] max-w-xl items-center px-4 py-16 text-center sm:px-6">
        <div className="w-full border border-[#dfe4e0] bg-[#f7f8f6] px-6 py-14">
          <h2 className="text-2xl font-bold text-[#142019]">
            {isArabic
              ? "لا توجد منتجات جديدة حالياً"
              : "No new arrivals yet"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#647168]">
            {isArabic
              ? "ستتم إضافة المنتجات الجديدة قريباً."
              : "New products will be added soon."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={
        isArabic
          ? "المنتجات الجديدة"
          : "New arrivals products"
      }
      className="mx-auto w-full max-w-[1720px] px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8"
    >
      {(firstProducts.length >
        0 ||
        firstDiscovery) && (
        <div
          dir="ltr"
          className={`grid grid-cols-2 items-stretch gap-x-4 gap-y-12 sm:gap-x-6 ${
            firstDiscovery
              ? "lg:grid-cols-4 lg:gap-x-8"
              : "lg:grid-cols-2 lg:gap-x-8"
          }`}
        >
          {firstProducts.map(
            (product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
              />
            )
          )}

          {firstDiscovery && (
            <div className="col-span-2">
              <DiscoveryTile
                banner={
                  firstDiscovery
                }
              />
            </div>
          )}
        </div>
      )}

      {middleProducts.length >
        0 && (
        <div
          dir="ltr"
          className="mt-14 grid grid-cols-2 items-stretch gap-x-4 gap-y-12 sm:mt-16 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8"
        >
          {middleProducts.map(
            (product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
              />
            )
          )}
        </div>
      )}

      {(secondProducts.length >
        0 ||
        secondDiscovery) && (
        <div
          dir="ltr"
          className={`mt-14 grid grid-cols-2 items-stretch gap-x-4 gap-y-12 sm:mt-16 sm:gap-x-6 ${
            secondDiscovery
              ? "lg:grid-cols-4 lg:gap-x-8"
              : "lg:grid-cols-2 lg:gap-x-8"
          }`}
        >
          {secondDiscovery && (
            <div className="col-span-2">
              <DiscoveryTile
                banner={
                  secondDiscovery
                }
              />
            </div>
          )}

          {secondProducts.map(
            (product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
              />
            )
          )}
        </div>
      )}

      {remainingProducts.length >
        0 && (
        <div
          dir="ltr"
          className="mt-14 grid grid-cols-2 items-stretch gap-x-4 gap-y-12 sm:mt-16 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4"
        >
          {remainingProducts.map(
            (product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}
