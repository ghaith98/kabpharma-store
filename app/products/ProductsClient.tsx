"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  FaFilter,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

import { useLanguage } from "../../context/LanguageContext";
import { useDialogFocus } from "@/lib/use-dialog-focus";
import EditorialProductCard from "./EditorialProductCard";
import NewArrivalsBanner from "../NewArrivalsBanner";
import RoutineBanner from "./RoutineBanner";
import type {
  EditorialProduct,
} from "./EditorialProductCard";

type ProductsClientProps = {
  products: EditorialProduct[];
  showSearch?: boolean;
  showCategories?: boolean;
  bestSellerIds?: number[];
  showHeader?: boolean;
  standaloneCollection?: boolean;
  concern?: {
    id: number;
    name_ar: string | null;
    name_en: string | null;
    description_ar: string | null;
    description_en: string | null;
    image_url: string | null;
    banner_image_url: string | null;
    banner_image_url_mobile: string | null;
  } | null;
};

function parseCategoryId(value: string | null) {
  const categoryId = value ? Number(value) : Number.NaN;

  return Number.isFinite(categoryId) && categoryId > 0
    ? categoryId
    : null;
}

function parseIdsParam(value: string | null) {
  if (!value) {
    return null;
  }

  const ids = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter(
      (id) => Number.isFinite(id) && id > 0
    );

  return ids.length > 0 ? new Set(ids) : null;
}

export default function ProductsClient({
  products,
  showSearch = false,
  showCategories = true,
  showHeader = true,
  bestSellerIds = [],
  standaloneCollection = false,
  concern = null,
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

  const search = standaloneCollection
    ? ""
    : searchParams.get("search") || "";
  const selectedCategoryId = standaloneCollection
    ? null
    : parseCategoryId(searchParams.get("category"));
  const selectedIds = standaloneCollection
    ? null
    : parseIdsParam(searchParams.get("ids"));
  const collectionLabel = standaloneCollection
    ? ""
    : searchParams.get("label") || "";

  const activeConcernName = concern
    ? isArabic
      ? concern.name_ar || concern.name_en
      : concern.name_en || concern.name_ar
    : null;

  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const filtersDialogRef =
    useRef<HTMLElement>(null);

  useDialogFocus(filtersOpen, filtersDialogRef);

  const [sortBy, setSortBy] =
    useState("default");

  const [storedPriceRange, setPriceRange] =
    useState<number[]>([
      0,
      maxProductPrice,
    ]);

  const priceRange = useMemo(
    () => [
      Math.min(storedPriceRange[0] || 0, maxProductPrice),
      storedPriceRange[1] === 0
        ? maxProductPrice
        : Math.min(storedPriceRange[1], maxProductPrice),
    ],
    [storedPriceRange, maxProductPrice]
  );

  const [inStockOnly, setInStockOnly] =
    useState(false);

  const [onSaleOnly, setOnSaleOnly] =
    useState(false);

  const replaceProductParams = useCallback((
    updates: {
      search?: string | null;
      categoryId?: number | null;
      clearCollection?: boolean;
    }
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if ("search" in updates) {
      const nextSearch = updates.search?.trim();

      if (nextSearch) {
        params.set("search", nextSearch);
      } else {
        params.delete("search");
      }
    }

    if ("categoryId" in updates) {
      if (updates.categoryId) {
        params.set("category", String(updates.categoryId));
      } else {
        params.delete("category");
      }
    }

    if (updates.clearCollection) {
      params.delete("ids");
      params.delete("label");
    }

    const queryString = params.toString();

    window.history.replaceState(
      null,
      "",
      queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname
    );
  }, [searchParams]);

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

  useEffect(() => {
    function resetProductsView() {
      replaceProductParams({
        search: null,
        categoryId: null,
      });
      setSortBy("default");
      setPriceRange([
        0,
        maxProductPrice,
      ]);
      setInStockOnly(false);
      setOnSaleOnly(false);
      setFiltersOpen(false);
    }

    window.addEventListener(
      "productsResetRequested",
      resetProductsView
    );

    return () => {
      window.removeEventListener(
        "productsResetRequested",
        resetProductsView
      );
    };
  }, [maxProductPrice, replaceProductParams]);

  const categories = useMemo(() => {
    const categoryMap = new Map<
      number,
      {
        id: number;
        name?: string | null;
        name_ar?: string | null;
        name_en?: string | null;
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
  product: EditorialProduct
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
    replaceProductParams({
      categoryId: null,
    });
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

  const sortLabels: Record<string, { ar: string; en: string }> = {
    bestsellers: {
      ar: "الأكثر مبيعاً أولاً",
      en: "Bestsellers first",
    },
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

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  );

  const selectedCategoryLabel = selectedCategory
    ? isArabic
      ? selectedCategory.name_ar ||
        selectedCategory.name ||
        selectedCategory.name_en
      : selectedCategory.name_en ||
        selectedCategory.name ||
        selectedCategory.name_ar
    : null;

  type FilterChip = {
    key: string;
    label: string;
    onRemove: () => void;
  };

  const filterChips: FilterChip[] = [];

  if (collectionLabel) {
    filterChips.push({
      key: "collection",
      label: collectionLabel,
      onRemove: () =>
        replaceProductParams({ clearCollection: true }),
    });
  }

  if (selectedCategoryLabel) {
    filterChips.push({
      key: "category",
      label: selectedCategoryLabel,
      onRemove: () =>
        replaceProductParams({ categoryId: null }),
    });
  }

  if (
    priceRange[0] > 0 ||
    priceRange[1] < maxProductPrice
  ) {
    filterChips.push({
      key: "price",
      label: `${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}`,
      onRemove: () =>
        setPriceRange([0, maxProductPrice]),
    });
  }

  if (inStockOnly) {
    filterChips.push({
      key: "stock",
      label: isArabic ? "متوفر فقط" : "In stock only",
      onRemove: () => setInStockOnly(false),
    });
  }

  if (onSaleOnly) {
    filterChips.push({
      key: "sale",
      label: isArabic ? "عليه تخفيض" : "On sale",
      onRemove: () => setOnSaleOnly(false),
    });
  }

  if (sortBy !== "default" && sortLabels[sortBy]) {
    filterChips.push({
      key: "sort",
      label: isArabic
        ? sortLabels[sortBy].ar
        : sortLabels[sortBy].en,
      onRemove: () => setSortBy("default"),
    });
  }

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

            const matchesIds =
              selectedIds === null ||
              selectedIds.has(
                Number(product.id)
              );

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
              matchesIds &&
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
                sortBy === "bestsellers"
              ) {
                const firstRank =
                  bestSellerIds.indexOf(
                    Number(firstProduct.id)
                  );

                const secondRank =
                  bestSellerIds.indexOf(
                    Number(secondProduct.id)
                  );

                const firstScore =
                  firstRank === -1
                    ? Number.MAX_SAFE_INTEGER
                    : firstRank;

                const secondScore =
                  secondRank === -1
                    ? Number.MAX_SAFE_INTEGER
                    : secondRank;

                return (
                  firstScore - secondScore
                );
              }

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
          selectedIds,
          priceRange,
          inStockOnly,
          onSaleOnly,
          sortBy,
          bestSellerIds,
        ]);

      return (
        <>
          {concern && activeConcernName && (
            <NewArrivalsBanner
              banner={{
                image_url:
                  concern.banner_image_url || concern.image_url,
                image_url_mobile:
                  concern.banner_image_url_mobile ||
                  concern.banner_image_url ||
                  concern.image_url,
            title_ar: concern.name_ar,
                title_en: concern.name_en,
                text_ar: concern.description_ar,
                text_en: concern.description_en,
              }}
              pageType="concern"
            />
          )}

          <div
          dir={isArabic ? "rtl" : "ltr"}
          className="mx-auto w-full max-w-[1720px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8"
        >
          {showHeader && !activeConcernName && (
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
                        ? "tracking-normal [font-family:var(--font-arabic)]"
                        : "tracking-[-0.04em]"
                    }`}
                  >
                    {collectionLabel ||
                      (isArabic
                        ? "اكتشف منتجاتنا"
                        : "Discover our products")}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
                    {collectionLabel
                      ? isArabic
                        ? `منتجات مختارة لـ${collectionLabel}.`
                        : `Products selected for ${collectionLabel}.`
                      : isArabic
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
                      replaceProductParams({
                        search: event.target.value,
                      })
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

            {!standaloneCollection && activeFiltersCount >
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

          {!standaloneCollection && (
          <div className="flex w-full justify-start sm:w-auto">
    <button
      type="button"
      onClick={() =>
        setFiltersOpen(true)
      }
      aria-expanded={filtersOpen}
      aria-controls="product-filters"
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
          )}
        </div>

        {!standaloneCollection && filterChips.length > 0 && (
          <div
            dir={isArabic ? "rtl" : "ltr"}
            className="mb-6 flex flex-wrap gap-2"
          >
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="group flex items-center gap-2 rounded-full border border-[#dfe4e0] bg-white py-2 pl-3 pr-2 text-xs font-bold text-[#142019] transition hover:border-[#0a583b] hover:bg-[#edf5f0]"
              >
                <span>{chip.label}</span>

                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#edf0ed] text-[10px] text-[#647168] transition group-hover:bg-[#0a583b] group-hover:text-white">
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}

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
              {standaloneCollection
                ? isArabic
                  ? "سيتم إضافة منتجات مختارة لهذه الحاجة قريباً."
                  : "Curated products for this need will be added soon."
                : isArabic
                  ? "جرّب تغيير البحث أو إزالة بعض خيارات التصفية."
                  : "Try changing your search or removing some filters."}
            </p>

            {!standaloneCollection && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-full bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
            >
              {isArabic
                ? "مسح الفلاتر"
                : "Clear filters"}
            </button>
            )}
          </section>
        ) : (
         <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
  {filteredProducts.map(
    (product, index) => (
      <Fragment key={product.id}>
        <EditorialProductCard
          product={product}
          headingLevel={2}
          imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {!standaloneCollection && index === 3 && (
            <div className="col-span-full my-2">
              <RoutineBanner />
            </div>
          )}
      </Fragment>
    )
  )}
</div>
      )}

      {!standaloneCollection && filtersOpen && (
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
  ref={filtersDialogRef}
  id="product-filters"
  role="dialog"
  aria-modal="true"
  aria-labelledby="product-filters-title"
  tabIndex={-1}
  dir={
    isArabic
      ? "rtl"
      : "ltr"
  }
  className={`absolute inset-y-0 w-[78%] max-w-[320px] overflow-y-auto bg-white sm:w-[82%] sm:max-w-[340px] md:w-[90%] md:max-w-md ${
    isArabic
      ? "right-0 shadow-[-18px_0_60px_rgba(7,31,20,0.16)]"
      : "left-0 shadow-[18px_0_60px_rgba(7,31,20,0.16)]"
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

                  <h2
                    id="product-filters-title"
                    className="mt-1 text-xl font-extrabold text-[#142019]"
                  >
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
                          replaceProductParams({
                            categoryId: null,
                          })
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
                                replaceProductParams({
                                  categoryId: category.id,
                                })
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

                    <option value="bestsellers">
                      {isArabic
                        ? "الأكثر مبيعاً أولاً"
                        : "Bestsellers first"}
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
    </>
  );
}
