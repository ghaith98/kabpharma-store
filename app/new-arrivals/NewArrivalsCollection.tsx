"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { getImageProps } from "next/image";

import {
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { X } from "lucide-react";

import EditorialProductCard from "../products/EditorialProductCard";

import type {
  EditorialProduct,
} from "../products/EditorialProductCard";

import { useLanguage } from "../../context/LanguageContext";
import { useDialogFocus } from "@/lib/use-dialog-focus";

type DiscoveryBanner = {
  id: number;
  placement: string | null;
  image_url: string | null;
  image_url_mobile: string | null;
  title: string | null;
  title_ar: string | null;
  title_en: string | null;
  text: string | null;
  text_ar: string | null;
  text_en: string | null;
  button_text: string | null;
  button_text_ar: string | null;
  button_text_en?: string | null;
  link_url: string | null;
};

function getDiscoveryHref(
  banner: DiscoveryBanner
) {
  const currentHref =
    banner.link_url?.trim();

  const legacyNewArrivalsHref =
    "/new-arrivals#new-arrivals-products";

  if (
    banner.placement ===
    "best_sellers_discover_1"
  ) {
    return (
      currentHref ||
      legacyNewArrivalsHref
    );
  }

  if (
    banner.placement ===
    "new_arrivals_discover_1"
  ) {
    if (
      !currentHref ||
      currentHref ===
        legacyNewArrivalsHref
    ) {
      return "/best-sellers#best-sellers-products";
    }

    return currentHref;
  }

  if (
    banner.placement ===
    "best_sellers_discover_2"
  ) {
    if (
      !currentHref ||
      currentHref ===
        legacyNewArrivalsHref
    ) {
      return "/products";
    }

    return currentHref;
  }

  if (!currentHref) {
    return "/products";
  }

  return currentHref;
}

function getProductPrice(
  product: EditorialProduct
) {
  const variantPrices = (
    product.product_variants || []
  )
    .map((variant) =>
      Number(variant.price)
    )
    .filter((price) =>
      Number.isFinite(price)
    );

  const originalPrice =
    variantPrices.length > 0
      ? Math.min(...variantPrices)
      : Number(product.price || 0);

  const salePercent = Math.min(
    100,
    Math.max(
      0,
      Number(product.sale_percent || 0)
    )
  );

  return salePercent > 0
    ? originalPrice *
        (1 - salePercent / 100)
    : originalPrice;
}

function DiscoveryTile({
  banner,
}: {
  banner: DiscoveryBanner;
}) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const title = isArabic
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
    width: 1200,
    height: 576,
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
    height: 1000,
    sizes: "100vw",
    quality: 82,
  });

  return (
    <article className="h-full">
      <Link
        href={
          getDiscoveryHref(
            banner
          )
        }
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="group flex h-full min-h-[430px] flex-col overflow-hidden bg-white transition sm:min-h-[500px] lg:min-h-[570px]"
      >
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#f4f5f3] md:aspect-[5/3] lg:aspect-[25/12]">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={mobileSrcSet}
            />

            <source
              media="(min-width: 768px)"
              srcSet={desktopSrcSet}
            />

            <img
              {...desktopImageProps}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
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

          <span className="mt-5 inline-flex min-h-11 w-fit items-center justify-center border border-[#0a583b] px-5 text-xs font-extrabold text-[#0a583b] transition group-hover:bg-[#0a583b] group-hover:text-white sm:text-sm">
            {buttonText}
          </span>
        </div>
      </Link>
    </article>
  );
}

type NewArrivalsCollectionProps = {
  products: EditorialProduct[];
  discoveryBanners: DiscoveryBanner[];
  collectionType?:
    | "new-arrivals"
    | "best-sellers"
    | "concern";
  hasHero?: boolean;
};

export default function NewArrivalsCollection({
  products,
  discoveryBanners,
  collectionType = "new-arrivals",
  hasHero = true,
}: NewArrivalsCollectionProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const isBestSellers =
    collectionType === "best-sellers";

  const isConcern =
    collectionType === "concern";

  const collectionId =
    isConcern
      ? "concern-products"
      : isBestSellers
        ? "best-sellers-products"
        : "new-arrivals-products";

  const filterDialogId =
    `${collectionId}-filters`;

  const filterDialogTitleId =
    `${filterDialogId}-title`;

  const collectionTitle =
    isConcern
      ? ""
      : isArabic
        ? isBestSellers
          ? "الأكثر مبيعاً"
          : "وصل حديثاً"
        : isBestSellers
          ? "Best Sellers"
          : "New Arrivals";

  const collectionDescription =
    isConcern
      ? ""
      : isArabic
        ? isBestSellers
          ? "تصفّحي منتجات KAB Pharma الأكثر طلباً والمفضلة لدى عملائنا."
          : "اكتشفي أحدث منتجات KAB Pharma للعناية اليومية."
        : isBestSellers
          ? "Explore the KAB Pharma products most loved and ordered by our customers."
          : "Discover the latest KAB Pharma products for your everyday care routine.";

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [sortOpen, setSortOpen] =
    useState(false);

  const filtersDialogRef =
    useRef<HTMLElement>(null);

  const sortMenuRef =
    useRef<HTMLDivElement>(null);

  useDialogFocus(
    filtersOpen,
    filtersDialogRef
  );

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<number | null>(null);

  const [sortBy, setSortBy] =
    useState("default");

  const [inStockOnly, setInStockOnly] =
    useState(false);

  const [onSaleOnly, setOnSaleOnly] =
    useState(false);

  const maxProductPrice =
    useMemo(() => {
      return Math.max(
        0,
        ...products.map(
          getProductPrice
        )
      );
    }, [products]);

  const [storedPriceRange, setPriceRange] =
    useState<number[]>([
      0,
      maxProductPrice,
    ]);

  const priceRange = useMemo(
    () => [
      Math.min(
        storedPriceRange[0] || 0,
        maxProductPrice
      ),
      storedPriceRange[1] === 0
        ? maxProductPrice
        : Math.min(
            storedPriceRange[1],
            maxProductPrice
          ),
    ],
    [storedPriceRange, maxProductPrice]
  );

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function closeWithEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!sortOpen) return;

    function closeSortWhenClickingOutside(
      event: PointerEvent
    ) {
      if (
        !sortMenuRef.current?.contains(
          event.target as Node
        )
      ) {
        setSortOpen(false);
      }
    }

    function closeSortWithEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      closeSortWhenClickingOutside
    );
    window.addEventListener(
      "keydown",
      closeSortWithEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeSortWhenClickingOutside
      );
      window.removeEventListener(
        "keydown",
        closeSortWithEscape
      );
    };
  }, [sortOpen]);

  const categories = useMemo(() => {
    const categoryMap = new Map<
      number,
      NonNullable<
        EditorialProduct["categories"]
      >
    >();

    products.forEach((product) => {
      if (!product.categories?.id) {
        return;
      }

      categoryMap.set(
        Number(product.categories.id),
        product.categories
      );
    });

    return Array.from(
      categoryMap.values()
    );
  }, [products]);

  const filteredProducts =
    useMemo(() => {
      return [...products]
        .filter((product) => {
          const finalPrice =
            getProductPrice(product);

          const matchesCategory =
            selectedCategoryId === null ||
            Number(product.category_id) ===
              selectedCategoryId ||
            Number(product.categories?.id) ===
              selectedCategoryId;

          const matchesPrice =
            finalPrice >= priceRange[0] &&
            finalPrice <= priceRange[1];

          const matchesStock =
            !inStockOnly ||
            product.is_out_of_stock ===
              false;

          const matchesSale =
            !onSaleOnly ||
            Number(
              product.sale_percent || 0
            ) > 0;

          return (
            matchesCategory &&
            matchesPrice &&
            matchesStock &&
            matchesSale
          );
        })
        .sort((first, second) => {
          if (sortBy === "price_low") {
            return (
              getProductPrice(first) -
              getProductPrice(second)
            );
          }

          if (sortBy === "price_high") {
            return (
              getProductPrice(second) -
              getProductPrice(first)
            );
          }

          if (sortBy === "newest") {
            return (
              Number(second.id) -
              Number(first.id)
            );
          }

          return 0;
        });
    }, [
      products,
      selectedCategoryId,
      priceRange,
      inStockOnly,
      onSaleOnly,
      sortBy,
    ]);

  const hasProductFilters =
    selectedCategoryId !== null ||
    inStockOnly ||
    onSaleOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < maxProductPrice;

  const activeFiltersCount =
    (selectedCategoryId !== null ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (priceRange[0] > 0 ||
    priceRange[1] < maxProductPrice
      ? 1
      : 0);

  const sortLabels: Record<string, { ar: string; en: string }> = {
    newest: {
      ar: "الأحدث أولاً",
      en: "Newest first",
    },
    price_low: {
      ar: "السعر: الأقل أولاً",
      en: "Price: low to high",
    },
    price_high: {
      ar: "السعر: الأعلى أولاً",
      en: "Price: high to low",
    },
  };

  const selectedSortLabel =
    sortBy !== "default" && sortLabels[sortBy]
      ? isArabic
        ? sortLabels[sortBy].ar
        : sortLabels[sortBy].en
      : isArabic
        ? "ترتيب"
        : "Sort";

  function clearFilters() {
    setSelectedCategoryId(null);
    setSortBy("default");
    setPriceRange([
      0,
      maxProductPrice,
    ]);
    setInStockOnly(false);
    setOnSaleOnly(false);
  }

  const discoveryPlacementPrefix =
    isConcern
      ? "concern"
      : isBestSellers
        ? "best_sellers"
        : "new_arrivals";

  const firstDiscovery =
    hasProductFilters
      ? null
      : discoveryBanners.find(
          (banner) =>
            banner.placement ===
            `${discoveryPlacementPrefix}_discover_1`
        );

  const secondDiscovery =
    hasProductFilters ||
    !isBestSellers
      ? null
      : discoveryBanners.find(
          (banner) =>
            banner.placement ===
            `${discoveryPlacementPrefix}_discover_2`
        );

  const firstProductsEnd =
    firstDiscovery ? 2 : 0;

  const middleProductsEnd =
    secondDiscovery
      ? firstProductsEnd + 4
      : firstProductsEnd;

  const secondProductsEnd =
    secondDiscovery
      ? middleProductsEnd + 2
      : middleProductsEnd;

  const firstProducts =
    filteredProducts.slice(
      0,
      firstProductsEnd
    );

  const middleProducts =
    filteredProducts.slice(
      firstProductsEnd,
      middleProductsEnd
    );

  const secondProducts =
    filteredProducts.slice(
      middleProductsEnd,
      secondProductsEnd
    );

  const remainingProducts =
    filteredProducts.slice(
      secondProductsEnd
    );

  if (products.length === 0) {
    return (
      <section
        id={collectionId}
        dir={isArabic ? "rtl" : "ltr"}
        aria-label={collectionTitle}
        className="mx-auto w-full max-w-[1720px] px-4 py-16 sm:px-6 lg:px-8"
      >
        {!hasHero && (
          <header
            className={`mb-10 border-b border-[#e7ebe8] pb-8 sm:pb-10 ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
              KAB Pharma
            </p>

            <h1 className="mt-3 text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-5xl">
              {collectionTitle}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
              {collectionDescription}
            </p>
          </header>
        )}

        <div className="mx-auto flex min-h-[420px] max-w-xl items-center text-center">
          <div className="w-full border border-[#dfe4e0] bg-[#f7f8f6] px-6 py-14">
          <h2 className="text-2xl font-bold text-[#142019]">
            {isArabic
              ? isConcern
                ? "لا توجد منتجات هنا حالياً"
                : isBestSellers
                  ? "لا توجد منتجات ضمن الأكثر مبيعاً حالياً"
                  : "لا توجد منتجات جديدة حالياً"
              : isConcern
                ? "No products here yet"
                : isBestSellers
                  ? "No best sellers yet"
                  : "No new arrivals yet"}
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#647168]">
            {isArabic
              ? isConcern
                ? "ستتم إضافة المنتجات قريباً."
                : isBestSellers
                  ? "ستظهر المنتجات هنا بعد تسجيل أولى المبيعات."
                  : "ستتم إضافة المنتجات الجديدة قريباً."
              : isConcern
                ? "Products will be added here soon."
                : isBestSellers
                  ? "Products will appear here after their first recorded sales."
                  : "New products will be added soon."}
          </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id={collectionId}
      dir={isArabic ? "rtl" : "ltr"}
      aria-label={collectionTitle}
      className="mx-auto w-full max-w-[1720px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8"
    >
      {!hasHero && (
        <header
          className={`mb-10 border-b border-[#e7ebe8] pb-8 sm:pb-10 ${
            isArabic
              ? "text-right"
              : "text-left"
          }`}
        >
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
            KAB Pharma
          </p>

          <h1 className="mt-3 text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-5xl">
            {collectionTitle}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {collectionDescription}
          </p>
        </header>
      )}

      <div
        dir="ltr"
        className="flex items-center justify-between gap-3 py-5"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#526057]">
            {isArabic
              ? `${filteredProducts.length} ${
                  filteredProducts.length === 1
                    ? "منتج"
                    : "منتجات"
                }`
              : `${filteredProducts.length} ${
                  filteredProducts.length === 1
                    ? "product"
                    : "products"
                } found`}
          </p>
        </div>

        <div
          ref={sortMenuRef}
          dir="ltr"
          className="relative flex shrink-0 items-center gap-4 text-sm sm:gap-6"
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSortOpen(false);
                setFiltersOpen(true);
              }}
              aria-expanded={filtersOpen}
              aria-controls={filterDialogId}
              className="inline-flex min-h-9 items-center bg-transparent px-0.5 font-medium text-[#142019] transition hover:opacity-60"
            >
              <span dir={isArabic ? "rtl" : "ltr"}>
                {isArabic ? "تصفية" : "Filter"}
                {activeFiltersCount > 0
                  ? ` (${activeFiltersCount})`
                  : ""}
              </span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearFilters();
                }}
                aria-label={
                  isArabic
                    ? "مسح الفلاتر"
                    : "Clear filters"
                }
                className="inline-flex h-10 w-6 -ml-2 items-center justify-center bg-transparent text-[#142019] transition hover:opacity-55"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSortOpen((current) => !current)}
            aria-expanded={sortOpen}
            aria-controls={`${collectionId}-sort-menu`}
            className="inline-flex min-h-9 items-center bg-transparent px-0.5 font-medium text-[#142019] transition hover:opacity-60"
          >
            <span dir={isArabic ? "rtl" : "ltr"}>
              {selectedSortLabel}
            </span>
          </button>

          {sortOpen && (
            <div
              id={`${collectionId}-sort-menu`}
              role="menu"
              className="absolute right-0 top-[calc(100%+0.15rem)] z-30 min-w-[190px] overflow-hidden border border-[#dfe4e0] bg-white py-0 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            >
              {[
                ["default", isArabic ? "الترتيب الافتراضي" : "Default"],
                ["newest", isArabic ? "الأحدث أولاً" : "Newest first"],
                ["price_low", isArabic ? "السعر: من الأقل إلى الأعلى" : "Price: low to high"],
                ["price_high", isArabic ? "السعر: من الأعلى إلى الأقل" : "Price: high to low"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={sortBy === value}
                  onClick={() => {
                    setSortBy(value);
                    setSortOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-1.5 text-sm font-normal leading-5 transition ${
                    isArabic
                      ? "justify-end text-right"
                      : "justify-start text-left"
                  } ${
                    sortBy === value
                      ? "bg-[#edf5f0] font-medium text-[#0a583b]"
                      : "text-[#142019] hover:bg-[#f5f7f5]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <section className="flex min-h-[340px] flex-col items-center justify-center border border-dashed border-[#dce3de] bg-[#fafbfa] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center bg-[#edf5f0] text-[#0a583b]">
            <FaSearch />
          </div>

          <h2 className="mt-6 text-xl font-extrabold text-[#142019] sm:text-2xl">
            {isArabic
              ? "لم يتم العثور على منتجات"
              : "No products found"}
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-6 bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
          >
            {isArabic
              ? "مسح الفلاتر"
              : "Clear filters"}
          </button>
        </section>
      ) : (
        <div
          dir="ltr"
          className="grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8"
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
            <div
              key={`banner-${firstDiscovery.id}`}
              className="col-span-2"
            >
              <DiscoveryTile
                banner={firstDiscovery}
              />
            </div>
          )}

          {middleProducts.map(
            (product) => (
              <EditorialProductCard
                key={product.id}
                product={product}
              />
            )
          )}

          {secondDiscovery && (
            <div
              key={`banner-${secondDiscovery.id}`}
              className="col-span-2"
            >
              <DiscoveryTile
                banner={secondDiscovery}
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

      {filtersOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/55"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setFiltersOpen(false);
            }
          }}
        >
          <aside
            ref={filtersDialogRef}
            id={filterDialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={filterDialogTitleId}
            tabIndex={-1}
            dir={isArabic ? "rtl" : "ltr"}
            className="absolute inset-x-0 bottom-0 max-h-[76dvh] overflow-y-auto bg-white shadow-[0_-12px_50px_rgba(0,0,0,0.18)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(78vh,650px)] sm:w-[min(700px,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:shadow-[0_18px_70px_rgba(0,0,0,0.24)]"
          >
            <div className="flex min-h-full flex-col">
              <div
                dir="ltr"
                className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ebe8] bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <h2
                    id={filterDialogTitleId}
                    dir={isArabic ? "rtl" : "ltr"}
                    className="text-sm font-semibold text-black"
                  >
                    {isArabic
                      ? "تصفية المنتجات"
                      : "Filters"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(false)
                  }
                  aria-label={
                    isArabic
                      ? "إغلاق"
                      : "Close"
                  }
                  className="flex h-11 w-11 items-center justify-center border-2 border-[#dfe4e0] bg-white text-lg text-[#142019] transition hover:bg-[#edf5f0]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 px-2 pb-4">
                <section className="py-4">
                  <h3 className="mb-2 text-sm font-medium text-black">
                    {isArabic
                      ? "التصنيفات"
                      : "Category"}
                  </h3>

                  <div className="flex flex-wrap gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategoryId(null)
                      }
                      className={`border px-3 py-3 text-sm italic transition ${
                        selectedCategoryId === null
                          ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                          : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                      }`}
                    >
                      {isArabic ? "الكل" : "All"}
                    </button>

                    {categories.map((category) => {
                      const label = isArabic
                        ? category.name_ar ||
                          category.name ||
                          category.name_en
                        : category.name_en ||
                          category.name ||
                          category.name_ar;

                      const id = Number(
                        category.id
                      );

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            setSelectedCategoryId(id)
                          }
                          className={`border px-3 py-3 text-sm italic transition ${
                            selectedCategoryId === id
                              ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                              : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="py-4">
                  <h3 className="mb-2 text-sm font-medium text-black">
                    {isArabic
                      ? "التوفر والعروض"
                      : "Availability & offers"}
                  </h3>

                  <div className="flex flex-wrap gap-0.5">
                    <label className={`cursor-pointer border px-3 py-3 text-sm italic transition ${
                      inStockOnly
                        ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                        : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                    }`}>
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={() =>
                          setInStockOnly(
                            (current) => !current
                          )
                        }
                        className="sr-only"
                      />

                      <span>
                        {isArabic
                          ? "متوفر"
                          : "In stock"}
                      </span>
                    </label>

                    <label className={`cursor-pointer border px-3 py-3 text-sm italic transition ${
                      onSaleOnly
                        ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                        : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                    }`}>
                      <input
                        type="checkbox"
                        checked={onSaleOnly}
                        onChange={() =>
                          setOnSaleOnly(
                            (current) => !current
                          )
                        }
                        className="sr-only"
                      />

                      <span>
                        {isArabic
                          ? "تخفيضات"
                          : "On sale"}
                      </span>
                    </label>
                  </div>
                </section>

                <section className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-medium text-black">
                      {isArabic
                        ? "نطاق السعر"
                        : "Price range"}
                    </h3>

                    <span className="text-xs text-[#666]">
                      {isArabic ? "ل.س" : "SYP"}
                    </span>
                  </div>

                  <div dir="ltr" className="mt-4 px-2">
                    <Slider
                      range
                      min={0}
                      max={maxProductPrice}
                      value={priceRange}
                      onChange={(value) =>
                        setPriceRange(
                          value as number[]
                        )
                      }
                      className="kab-price-slider"
                    />

                    <div className="mt-2 flex items-center justify-between text-[10px] leading-none text-[#555]">
                      <span>
                        {priceRange[0].toLocaleString()} SYP
                      </span>

                      <span>
                        {priceRange[1].toLocaleString()} SYP
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 z-20 grid grid-cols-2 gap-3 bg-white px-2 pb-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setFiltersOpen(false);
                  }}
                  className="min-h-11 border border-[#c5cdc7] border-b-[3px] border-b-[#a8b3ab] bg-[#f5f7f5] px-3 text-sm font-medium text-[#142019] transition hover:brightness-[0.97] active:border-b active:mt-[2px]"
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(false)
                  }
                  className="min-h-11 border border-[#0a583b] border-b-[3px] border-b-[#063a28] bg-[#0a583b] px-3 text-sm font-semibold text-white transition hover:brightness-[0.95] active:border-b active:mt-[2px]"
                >
                  {isArabic
                    ? `تطبيق`
                    : `Apply`}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
