"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { getImageProps } from "next/image";

import {
  FaFilter,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import EditorialProductCard from "./EditorialProductCard";

import type {
  EditorialProduct,
} from "./EditorialProductCard";

import { useLanguage } from "../../context/LanguageContext";

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
        className="group flex h-full min-h-[430px] flex-col overflow-hidden bg-white transition sm:min-h-[500px] lg:min-h-[570px]"
      >
        <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#f4f5f3] md:aspect-[5/3] lg:aspect-auto lg:h-[calc((100%_-_2rem)/2)]">
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

          <span className="mt-5 inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[#0a583b] px-5 text-xs font-extrabold text-[#0a583b] transition group-hover:bg-[#0a583b] group-hover:text-white sm:text-sm">
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
};

export default function NewArrivalsCollection({
  products,
  discoveryBanners,
}: NewArrivalsCollectionProps) {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const [filtersOpen, setFiltersOpen] =
    useState(false);

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
      : 0) +
    (sortBy !== "default" ? 1 : 0);

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

  const firstProducts =
    filteredProducts.slice(0, 2);

  const middleProducts =
    filteredProducts.slice(2, 6);

  const secondProducts =
    filteredProducts.slice(6, 8);

  const remainingProducts =
    filteredProducts.slice(8);

  const firstDiscovery =
    hasProductFilters
      ? null
      : discoveryBanners.find(
          (banner) =>
            banner.placement ===
            "new_arrivals_discover_1"
        );

  const secondDiscovery =
    hasProductFilters
      ? null
      : discoveryBanners.find(
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
      dir={isArabic ? "rtl" : "ltr"}
      aria-label={
        isArabic
          ? "المنتجات الجديدة"
          : "New arrivals products"
      }
      className="mx-auto w-full max-w-[1720px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8"
    >
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-[#e7ebe8] pb-5 sm:mb-9 sm:pb-6">
        <div>
          <p className="text-sm font-bold text-[#526057]">
            {isArabic
              ? `${filteredProducts.length} منتجات`
              : `${filteredProducts.length} products found`}
          </p>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-1 text-xs font-extrabold text-[#0a583b] underline decoration-[#b9d3c3] underline-offset-4"
            >
              {isArabic
                ? "مسح جميع الفلاتر"
                : "Clear all filters"}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setFiltersOpen(true)
          }
          className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-4 text-xs font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:bg-[#edf5f0] hover:text-[#0a583b] sm:min-h-12 sm:px-6 sm:text-sm"
        >
          <FaFilter className="text-xs sm:text-sm" />

          <span>
            {isArabic
              ? "تصفية وترتيب"
              : "Filter & sort"}
          </span>

          {activeFiltersCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0a583b] px-1 text-[10px] font-extrabold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <section className="flex min-h-[340px] flex-col items-center justify-center border border-dashed border-[#dce3de] bg-[#fafbfa] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
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
            className="mt-6 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
          >
            {isArabic
              ? "مسح الفلاتر"
              : "Clear filters"}
          </button>
        </section>
      ) : (
        <>
          {(firstProducts.length > 0 ||
            firstDiscovery) && (
            <div
              dir="ltr"
              className={`grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 ${
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
                    banner={firstDiscovery}
                  />
                </div>
              )}
            </div>
          )}

          {middleProducts.length > 0 && (
            <div
              dir="ltr"
              className="mt-10 grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:mt-12 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8"
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

          {(secondProducts.length > 0 ||
            secondDiscovery) && (
            <div
              dir="ltr"
              className={`mt-10 grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:mt-12 sm:gap-x-6 sm:gap-y-10 ${
                secondDiscovery
                  ? "lg:grid-cols-4 lg:gap-x-8"
                  : "lg:grid-cols-2 lg:gap-x-8"
              }`}
            >
              {secondDiscovery && (
                <div className="col-span-2">
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
            </div>
          )}

          {remainingProducts.length > 0 && (
            <div
              dir="ltr"
              className="mt-10 grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:mt-12 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4"
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
        </>
      )}

      {filtersOpen && (
        <div
          className="fixed inset-0 z-[999] bg-[#07130d]/50 backdrop-blur-sm"
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
            dir={isArabic ? "rtl" : "ltr"}
            className={`absolute inset-y-0 w-[86%] max-w-[340px] overflow-y-auto bg-white md:max-w-md ${
              isArabic
                ? "right-0 shadow-[-18px_0_60px_rgba(7,31,20,0.16)]"
                : "left-0 shadow-[18px_0_60px_rgba(7,31,20,0.16)]"
            }`}
          >
            <div className="flex min-h-full flex-col">
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ebe8] bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                <h2 className="text-xl font-extrabold text-[#142019]">
                  {isArabic
                    ? "تصفية وترتيب"
                    : "Filter & sort"}
                </h2>

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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5f3] text-[#526057]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 px-5 sm:px-7">
                <section className="border-b border-[#e7ebe8] py-6">
                  <h3 className="text-sm font-extrabold text-[#142019]">
                    {isArabic
                      ? "تصنيفات المنتجات"
                      : "Product categories"}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategoryId(null)
                      }
                      className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                        selectedCategoryId === null
                          ? "border-[#0a583b] bg-[#0a583b] text-white"
                          : "border-[#dfe4e0] bg-white text-[#526057]"
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
                          className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                            selectedCategoryId === id
                              ? "border-[#0a583b] bg-[#0a583b] text-white"
                              : "border-[#dfe4e0] bg-white text-[#526057]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="border-b border-[#e7ebe8] py-6">
                  <h3 className="text-sm font-extrabold text-[#142019]">
                    {isArabic
                      ? "التوفر والعروض"
                      : "Availability & offers"}
                  </h3>

                  <div className="mt-5 space-y-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="text-sm font-bold text-[#526057]">
                        {isArabic
                          ? "المنتجات المتوفرة فقط"
                          : "In-stock products only"}
                      </span>

                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={() =>
                          setInStockOnly(
                            (current) => !current
                          )
                        }
                        className="h-5 w-5 accent-[#0a583b]"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="text-sm font-bold text-[#526057]">
                        {isArabic
                          ? "المنتجات المخفضة"
                          : "Products on sale"}
                      </span>

                      <input
                        type="checkbox"
                        checked={onSaleOnly}
                        onChange={() =>
                          setOnSaleOnly(
                            (current) => !current
                          )
                        }
                        className="h-5 w-5 accent-[#0a583b]"
                      />
                    </label>
                  </div>
                </section>

                <section className="border-b border-[#e7ebe8] py-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-extrabold text-[#142019]">
                      {isArabic
                        ? "نطاق السعر"
                        : "Price range"}
                    </h3>

                    <span className="text-xs font-bold text-[#647168]">
                      SYP
                    </span>
                  </div>

                  <div dir="ltr" className="mt-7 px-2">
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

                    <div className="mt-5 flex justify-between text-xs font-extrabold text-[#526057]">
                      <span>
                        {priceRange[0].toLocaleString()} SYP
                      </span>

                      <span>
                        {priceRange[1].toLocaleString()} SYP
                      </span>
                    </div>
                  </div>
                </section>

                <section className="py-6">
                  <label
                    htmlFor="new-arrivals-sort"
                    className="mb-3 block text-sm font-extrabold text-[#142019]"
                  >
                    {isArabic
                      ? "ترتيب المنتجات"
                      : "Sort products"}
                  </label>

                  <select
                    id="new-arrivals-sort"
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(event.target.value)
                    }
                    className="min-h-12 w-full rounded-2xl border border-[#dfe4e0] bg-white px-4 text-sm font-bold text-[#142019] outline-none focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
                  >
                    <option value="default">
                      {isArabic
                        ? "الترتيب الافتراضي"
                        : "Default"}
                    </option>

                    <option value="newest">
                      {isArabic
                        ? "الأحدث أولاً"
                        : "Newest first"}
                    </option>

                    <option value="price_low">
                      {isArabic
                        ? "السعر: من الأقل إلى الأعلى"
                        : "Price: low to high"}
                    </option>

                    <option value="price_high">
                      {isArabic
                        ? "السعر: من الأعلى إلى الأقل"
                        : "Price: high to low"}
                    </option>
                  </select>
                </section>
              </div>

              <div className="sticky bottom-0 z-20 grid grid-cols-2 gap-3 border-t border-[#e7ebe8] bg-white/95 p-5 backdrop-blur sm:p-7">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-12 rounded-full border border-[#dfe4e0] bg-white px-4 text-sm font-extrabold text-[#526057]"
                >
                  {isArabic ? "مسح" : "Clear"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(false)
                  }
                  className="min-h-12 rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
                >
                  {isArabic
                    ? `عرض ${filteredProducts.length} منتجات`
                    : `Show ${filteredProducts.length} products`}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}