"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  FaFilter,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import AddToCartButton from "./AddToCartButton";
import WishlistButton from "./WishlistButton";

import { useLanguage } from "../../context/LanguageContext";

type ProductsClientProps = {
  products: any[];
  showSearch?: boolean;
  showCategories?: boolean;
  bestSellerIds?: number[];
  showHeader?: boolean;
};

export default function ProductsClient({
  products,
  showSearch = false,
  showCategories = true,
  showHeader = true,
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  const isArabic = lang === "ar";

  const maxProductPrice = useMemo(() => {
    return Math.max(
      0,
      ...products.map((product) =>
        Number(product.price || 0)
      )
    );
  }, [products]);

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [
  selectedCategoryId,
  setSelectedCategoryId,
] = useState<number | null>(
  () => {
    const categoryParam =
      searchParams.get(
        "category"
      );

    if (!categoryParam) {
      return null;
    }

    const parsedCategoryId =
      Number(categoryParam);

    return Number.isFinite(
      parsedCategoryId
    ) &&
      parsedCategoryId > 0
      ? parsedCategoryId
      : null;
  }
);

  const [sortBy, setSortBy] =
    useState("default");

  const [priceRange, setPriceRange] =
    useState<number[]>([
      0,
      maxProductPrice,
    ]);

  const [inStockOnly, setInStockOnly] =
    useState(false);

  const [onSaleOnly, setOnSaleOnly] =
    useState(false);

  useEffect(() => {
  setSearch(
    searchParams.get("search") || ""
  );

  const categoryParam =
    searchParams.get(
      "category"
    );

  const parsedCategoryId =
    categoryParam
      ? Number(categoryParam)
      : NaN;

  setSelectedCategoryId(
    Number.isFinite(
      parsedCategoryId
    ) &&
      parsedCategoryId > 0
      ? parsedCategoryId
      : null
  );
}, [searchParams]);

  useEffect(() => {
    setPriceRange((currentRange) => {
      if (
        currentRange[1] === 0 ||
        currentRange[1] >
          maxProductPrice
      ) {
        return [
          0,
          maxProductPrice,
        ];
      }

      return currentRange;
    });
  }, [maxProductPrice]);

  useEffect(() => {
    if (!filtersOpen) return;

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
      {
        id: number;
        name?: string;
        name_ar?: string;
        name_en?: string;
      }
    >();

    products.forEach((product) => {
      if (!product.categories?.id) {
        return;
      }

      categoryMap.set(
        Number(product.categories.id),
        {
          id: Number(
            product.categories.id
          ),

          name:
            product.categories.name,

          name_ar:
            product.categories.name_ar,

          name_en:
            product.categories.name_en,
        }
      );
    });

    return Array.from(
      categoryMap.values()
    );
  }, [products]);

  function getFinalPrice(
    product: any
  ) {
    const salePercent = Math.min(
      100,
      Math.max(
        0,
        Number(
          product.sale_percent || 0
        )
      )
    );

    const originalPrice = Number(
      product.price || 0
    );

    return salePercent > 0
      ? originalPrice -
          originalPrice *
            (salePercent / 100)
      : originalPrice;
  }

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

  const activeFiltersCount =
    (selectedCategoryId !== null
      ? 1
      : 0) +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (priceRange[0] > 0 ||
    priceRange[1] <
      maxProductPrice
      ? 1
      : 0) +
    (sortBy !== "default"
      ? 1
      : 0);

    const filteredProducts =
      useMemo(() => {
        const cleanSearch = search
          .trim()
          .toLocaleLowerCase();

        return [...products]
          .filter((product) => {
            const productName =
              isArabic
                ? product.name_ar ||
                  product.name ||
                  product.name_en
                : product.name_en ||
                  product.name ||
                  product.name_ar;

            const productDescription =
              isArabic
                ? product.description_ar ||
                  product.description ||
                  product.description_en
                : product.description_en ||
                  product.description ||
                  product.description_ar;

            const categoryName =
              isArabic
                ? product.categories
                    ?.name_ar ||
                  product.categories
                    ?.name ||
                  product.categories
                    ?.name_en
                : product.categories
                    ?.name_en ||
                  product.categories
                    ?.name ||
                  product.categories
                    ?.name_ar;

            const searchableText = `
              ${productName || ""}
              ${productDescription || ""}
              ${categoryName || ""}
            `.toLocaleLowerCase();

            const finalPrice =
              getFinalPrice(product);

            const matchesSearch =
              !cleanSearch ||
              searchableText.includes(
                cleanSearch
              );

            const matchesCategory =
              selectedCategoryId ===
                null ||
              Number(
                product.category_id
              ) ===
                selectedCategoryId;

            const matchesPrice =
              finalPrice >=
                priceRange[0] &&
              finalPrice <=
                priceRange[1];

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
              matchesSearch &&
              matchesCategory &&
              matchesPrice &&
              matchesStock &&
              matchesSale
            );
          })
          .sort(
            (
              firstProduct,
              secondProduct
            ) => {
              if (
                sortBy === "price_low"
              ) {
                return (
                  getFinalPrice(
                    firstProduct
                  ) -
                  getFinalPrice(
                    secondProduct
                  )
                );
              }

              if (
                sortBy === "price_high"
              ) {
                return (
                  getFinalPrice(
                    secondProduct
                  ) -
                  getFinalPrice(
                    firstProduct
                  )
                );
              }

              if (
                sortBy === "newest"
              ) {
                return (
                  Number(
                    secondProduct.id
                  ) -
                  Number(
                    firstProduct.id
                  )
                );
              }

              return 0;
            }
          );
      }, [
        products,
        search,
        isArabic,
        selectedCategoryId,
        priceRange,
        inStockOnly,
        onSaleOnly,
        sortBy,
      ]);

    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8"
      >
        {showHeader && (
          <header
            className={`border-b border-[#e7ebe8] pb-8 sm:pb-10 ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] sm:text-xs ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.2em]"
              }`}
            >
              {isArabic
                ? "مجموعة كاب فارما"
                : "KAB Pharma collection"}
            </p>

            <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1
                  className={`text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-5xl ${
                    isArabic
                      ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                      : "tracking-[-0.04em]"
                  }`}
                >
                  {isArabic
                    ? "اكتشف منتجاتنا"
                    : "Discover our products"}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
                  {isArabic
                    ? "منتجات مختارة للعناية اليومية بالبشرة والجسم والشعر."
                    : "Explore skincare, body care and personal care products selected for your everyday routine."}
                </p>
              </div>

              {showSearch && (
                <div className="relative w-full lg:max-w-md">
                  <FaSearch
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-[#7a857e] ${
                      isArabic
                        ? "right-4"
                        : "left-4"
                    }`}
                  />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "ابحث عن منتج..."
                      : "Search products..."
                  }
                  className={`h-13 w-full rounded-full border border-[#dfe4e0] bg-white text-base text-[#142019] outline-none transition placeholder:text-[#99a29c] focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0] ${
                    isArabic
                      ? "pr-11 pl-5"
                      : "pl-11 pr-5"
                  }`}
                />
              </div>
            )}
          </div>
        </header>
      )}

      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#526057]">
            {isArabic
              ? `${filteredProducts.length} ${
                  filteredProducts.length ===
                  1
                    ? "منتج"
                    : "منتجات"
                }`
              : `${filteredProducts.length} ${
                  filteredProducts.length ===
                  1
                    ? "product"
                    : "products"
                } found`}
          </p>

          {activeFiltersCount >
            0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-1 text-xs font-extrabold text-[#0a583b] underline decoration-[#b9d3c3] underline-offset-4 transition hover:text-[#073f2c]"
            >
              {isArabic
                ? "مسح جميع الفلاتر"
                : "Clear all filters"}
            </button>
          )}
        </div>

        <div className="flex w-full justify-start">
  <button
    type="button"
    onClick={() =>
      setFiltersOpen(true)
    }
    className="relative inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#dfe4e0] bg-white px-4 text-xs font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:bg-[#edf5f0] hover:text-[#0a583b] sm:min-h-12 sm:px-6 sm:text-sm"
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
      </div>

      {filteredProducts.length ===
      0 ? (
        <section className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#dce3de] bg-[#fafbfa] px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
            <FaSearch />
          </div>

          <h2 className="mt-6 text-xl font-extrabold text-[#142019] sm:text-2xl">
            {isArabic
              ? "لم يتم العثور على منتجات"
              : "No products found"}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-7 text-[#647168]">
            {isArabic
              ? "جرّب تغيير البحث أو إزالة بعض خيارات التصفية."
              : "Try changing your search or removing some filters."}
          </p>

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
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map(
            (product) => {
              const salePercent =
                Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      product.sale_percent ||
                        0
                    )
                  )
                );

              const originalPrice =
                Number(
                  product.price || 0
                );

              const finalPrice =
                getFinalPrice(product);

              const productName =
                isArabic
                  ? product.name_ar ||
                    product.name ||
                    product.name_en
                  : product.name_en ||
                    product.name ||
                    product.name_ar;

              const categoryName =
                isArabic
                  ? product.categories
                      ?.name_ar ||
                    product.categories
                      ?.name ||
                    product.categories
                      ?.name_en
                  : product.categories
                      ?.name_en ||
                    product.categories
                      ?.name ||
                    product.categories
                      ?.name_ar;

              const isOutOfStock =
                Boolean(
                  product.is_out_of_stock
                );

              return (
                <article
                  key={product.id}
                  className="group flex min-h-[390px] flex-col overflow-hidden rounded-[1.4rem] border border-[#e7ebe8] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#d7e5dc] hover:shadow-xl hover:shadow-[#073f2c]/[0.06] sm:min-h-[430px] sm:rounded-[1.5rem]"
                >
                  <div className="relative h-[185px] shrink-0 overflow-hidden bg-[#f7f8f6] sm:h-[225px]">
                    <Link
                      href={`/products/${product.id}`}
                      aria-label={
                        productName
                      }
                      className="flex h-full w-full items-center justify-center p-3 sm:p-5"
                    >
                      {product.image_url ? (
                        <img
                          src={
                            product.image_url
                          }
                          alt={
                            productName
                          }
                          loading="lazy"
                          className={`h-full w-full object-contain transition duration-500 group-hover:scale-[1.04] ${
                            isOutOfStock
                              ? "opacity-55 grayscale-[25%]"
                              : ""
                          }`}
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#99a29c] sm:text-sm">
                          {isArabic
                            ? "لا توجد صورة"
                            : "No image"}
                        </span>
                      )}
                    </Link>

                    <div
                      dir="ltr"
                      className="absolute right-3 top-3 z-20"
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                    >
                      <WishlistButton
                        product={{
                          id:
                            product.id,

                          name:
                            productName,

                          price:
                            Math.round(
                              finalPrice
                            ),

                          original_price:
                            originalPrice,

                          sale_percent:
                            salePercent,

                          image_url:
                            product.image_url,
                        }}
                      />
                    </div>

                    <div className="absolute left-3 top-3 z-10">
                      {isOutOfStock ? (
                        <span className="inline-flex rounded-full border border-[#dfe4e0] bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-[#526057] shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">
                          {isArabic
                            ? "غير متوفر"
                            : "Out of stock"}
                        </span>
                      ) : salePercent >
                        0 ? (
                        <span className="inline-flex rounded-full border border-red-100 bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-red-600 shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">
                          -
                          {
                            salePercent
                          }
                          %
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className={`flex flex-1 flex-col p-3.5 sm:p-5 ${
                      isArabic
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    <p
  className={`min-h-4 truncate text-[9px] font-extrabold text-[#0a583b] sm:text-[10px] ${
    isArabic
      ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
      : "uppercase tracking-[0.12em]"
  }`}
>
  {categoryName || "KAB Pharma"}
</p>

                    <Link
                      href={`/products/${product.id}`}
                    >
                      <h2 className="mt-2 line-clamp-2 min-h-[44px] text-sm font-extrabold leading-[22px] text-[#142019] transition group-hover:text-[#0a583b] sm:min-h-[48px] sm:text-base sm:leading-6">
                        {
                          productName
                        }
                      </h2>
                    </Link>

                    <div className="mt-3 flex min-h-[45px] flex-col justify-end">
                      <p
                        className={`whitespace-nowrap text-sm font-extrabold sm:text-base ${
                          salePercent >
                          0
                            ? "text-red-600"
                            : "text-[#0a583b]"
                        }`}
                      >
                        {Math.round(
                          finalPrice
                        ).toLocaleString()}{" "}
                        SYP
                      </p>

                      <p
                        aria-hidden={
                          salePercent <=
                          0
                        }
                        className={`mt-1 whitespace-nowrap text-[10px] font-bold text-[#99a29c] line-through sm:text-[11px] ${
                          salePercent >
                          0
                            ? "visible"
                            : "invisible"
                        }`}
                      >
                        {originalPrice.toLocaleString()}{" "}
                        SYP
                      </p>
                    </div>

                    <div className="mt-auto pt-3">
                      {isOutOfStock ? (
                        <button
                          type="button"
                          disabled
                          className="min-h-11 w-full cursor-not-allowed rounded-full border border-[#dfe4e0] bg-[#f3f5f3] px-3 text-xs font-extrabold text-[#99a29c] sm:text-sm"
                        >
                          {isArabic
                            ? "غير متوفر"
                            : "Out of stock"}
                        </button>
                      ) : (
                        <div className="[&_button]:!min-h-11 [&_button]:!w-full [&_button]:!rounded-full [&_button]:!bg-[#0a583b] [&_button]:!px-3 [&_button]:!py-2.5 [&_button]:!text-xs [&_button]:!font-extrabold [&_button]:!text-white [&_button]:!shadow-none [&_button]:hover:!bg-[#073f2c] sm:[&_button]:!text-sm">
  <AddToCartButton
    product={{
      id: product.id,

      name: productName,

      price: Math.round(
        finalPrice
      ),

      original_price:
        originalPrice,

      sale_percent:
        salePercent,

      image_url:
        product.image_url,
    }}

    productVariants={
      product.product_variants ||
      []
    }
  />
</div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
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
  dir={
    isArabic
      ? "rtl"
      : "ltr"
  }
  className={`absolute inset-y-0 left-0 w-[86%] max-w-[360px] overflow-y-auto bg-white shadow-2xl sm:w-[90%] sm:max-w-md ${
    isArabic
      ? "md:left-0"
      : "md:left-auto md:right-0"
  }`}
>
            <div className="flex min-h-full flex-col">
              <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ebe8] bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
                <div>
                  <p
                    className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                      isArabic
                        ? "tracking-normal"
                        : "tracking-[0.18em]"
                    }`}
                  >
                    KAB Pharma
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-[#142019]">
                    {isArabic
                      ? "تصفية المنتجات"
                      : "Filter products"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(
                      false
                    )
                  }
                  aria-label={
                    isArabic
                      ? "إغلاق"
                      : "Close"
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3f5f3] text-[#526057] transition hover:bg-[#e7ebe8] hover:text-[#142019]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 px-5 sm:px-7">
                {showCategories && (
  <section className="hidden border-b border-[#e7ebe8] py-7 md:block">
                    <h3 className="text-sm font-extrabold text-[#142019]">
                      {isArabic
                        ? "تصنيفات المنتجات"
                        : "Product categories"}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategoryId(
                            null
                          )
                        }
                        className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                          selectedCategoryId ===
                          null
                            ? "border-[#0a583b] bg-[#0a583b] text-white"
                            : "border-[#dfe4e0] bg-white text-[#526057] hover:border-[#0a583b] hover:text-[#0a583b]"
                        }`}
                      >
                        {isArabic
                          ? "الكل"
                          : "All"}
                      </button>

                      {categories.map(
                        (
                          category
                        ) => {
                          const categoryLabel =
                            isArabic
                              ? category.name_ar ||
                                category.name ||
                                category.name_en
                              : category.name_en ||
                                category.name ||
                                category.name_ar;

                          const isSelected =
                            selectedCategoryId ===
                            category.id;

                          return (
                            <button
                              key={
                                category.id
                              }
                              type="button"
                              onClick={() =>
                                setSelectedCategoryId(
                                  category.id
                                )
                              }
                              className={`rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                                isSelected
                                  ? "border-[#0a583b] bg-[#0a583b] text-white"
                                  : "border-[#dfe4e0] bg-white text-[#526057] hover:border-[#0a583b] hover:text-[#0a583b]"
                              }`}
                            >
                              {
                                categoryLabel
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}

                <section className="border-b border-[#e7ebe8] py-7">
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
                        checked={
                          inStockOnly
                        }
                        onChange={() =>
                          setInStockOnly(
                            (
                              current
                            ) =>
                              !current
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
                        checked={
                          onSaleOnly
                        }
                        onChange={() =>
                          setOnSaleOnly(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        className="h-5 w-5 accent-[#0a583b]"
                      />
                    </label>
                  </div>
                </section>

                <section className="border-b border-[#e7ebe8] py-7">
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

                  <div
                    dir="ltr"
                    className="mt-7 px-2"
                  >
                    <Slider
                      range
                      min={0}
                      max={
                        maxProductPrice
                      }
                      value={
                        priceRange
                      }
                      onChange={(
                        value
                      ) =>
                        setPriceRange(
                          value as number[]
                        )
                      }
                      className="kab-price-slider"
                    />

                    <div className="mt-5 flex justify-between text-xs font-extrabold text-[#526057]">
                      <span>
                        {priceRange[0].toLocaleString()}{" "}
                        SYP
                      </span>

                      <span>
                        {priceRange[1].toLocaleString()}{" "}
                        SYP
                      </span>
                    </div>
                  </div>
                </section>

                <section className="py-7">
                  <label
                    htmlFor="product-sort"
                    className="mb-3 block text-sm font-extrabold text-[#142019]"
                  >
                    {isArabic
                      ? "ترتيب المنتجات"
                      : "Sort products"}
                  </label>

                  <select
                    id="product-sort"
                    value={sortBy}
                    onChange={(event) =>
                      setSortBy(
                        event.target
                          .value
                      )
                    }
                    className="min-h-12 w-full rounded-2xl border border-[#dfe4e0] bg-white px-4 text-sm font-bold text-[#142019] outline-none transition focus:border-[#0a583b] focus:ring-4 focus:ring-[#edf5f0]"
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
                  className="min-h-12 rounded-full border border-[#dfe4e0] bg-white px-4 text-sm font-extrabold text-[#526057] transition hover:border-[#0a583b] hover:text-[#0a583b]"
                >
                  {isArabic
                    ? "مسح"
                    : "Clear"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersOpen(
                      false
                    )
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
    </div>
  );
}