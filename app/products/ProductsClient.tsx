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
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { X } from "lucide-react";

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

function parseCategoryIds(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) => Number(part.trim()))
        .filter(
          (id) => Number.isFinite(id) && id > 0
        )
    )
  );
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
  const selectedCategoryIds = standaloneCollection
    ? []
    : parseCategoryIds(searchParams.get("category"));
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

  const [sortOpen, setSortOpen] = useState(false);

  const filtersDialogRef =
    useRef<HTMLElement>(null);

  const sortMenuRef =
    useRef<HTMLDivElement>(null);

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

  const [draftCategoryIds, setDraftCategoryIds] =
    useState<number[]>(selectedCategoryIds);
  const [draftPriceRange, setDraftPriceRange] =
    useState<number[]>(priceRange);
  const [draftInStockOnly, setDraftInStockOnly] =
    useState(inStockOnly);
  const [draftOnSaleOnly, setDraftOnSaleOnly] =
    useState(onSaleOnly);

  const replaceProductParams = useCallback((
    updates: {
      search?: string | null;
      categoryId?: number | null;
      categoryIds?: number[];
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

    if ("categoryIds" in updates) {
      if (updates.categoryIds?.length) {
        params.set(
          "category",
          updates.categoryIds.join(",")
        );
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeWithEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        cancelDraftFilters();
      }
    }

    window.addEventListener(
      "keydown",
      closeWithEscape
    );
    return () => {
      document.body.style.overflow = previousOverflow;

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

  function openFilters() {
    setDraftCategoryIds(selectedCategoryIds);
    setDraftPriceRange([...priceRange]);
    setDraftInStockOnly(inStockOnly);
    setDraftOnSaleOnly(onSaleOnly);
    setSortOpen(false);
    setFiltersOpen(true);
  }

  function cancelDraftFilters() {
    setDraftCategoryIds(selectedCategoryIds);
    setDraftPriceRange([...priceRange]);
    setDraftInStockOnly(inStockOnly);
    setDraftOnSaleOnly(onSaleOnly);
    setFiltersOpen(false);
  }

  function applyDraftFilters() {
    replaceProductParams({
      categoryIds: draftCategoryIds,
    });
    setPriceRange([...draftPriceRange]);
    setInStockOnly(draftInStockOnly);
    setOnSaleOnly(draftOnSaleOnly);
    setFiltersOpen(false);
  }

  const draftFiltersCount =
    draftCategoryIds.length +
    (draftInStockOnly ? 1 : 0) +
    (draftOnSaleOnly ? 1 : 0) +
    (draftPriceRange[0] > 0 ||
    draftPriceRange[1] < maxProductPrice
      ? 1
      : 0);

  const activeFiltersCount =
    selectedCategoryIds.length +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (priceRange[0] > 0 ||
    priceRange[1] <
      maxProductPrice
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

  const selectedSortLabel =
    sortBy !== "default" && sortLabels[sortBy]
      ? isArabic
        ? sortLabels[sortBy].ar
        : sortLabels[sortBy].en
      : isArabic
        ? "ترتيب"
        : "Sort";

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
              selectedCategoryIds.length ===
                0 ||
              selectedCategoryIds.includes(
              Number(
                product.category_id
              ));

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
          selectedCategoryIds,
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

        <div
          dir="ltr"
          className="flex items-center justify-between gap-3 py-5"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#526057]">
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

          </div>

          {!standaloneCollection && (
            <div
              ref={sortMenuRef}
              dir="ltr"
              className="relative flex shrink-0 items-center gap-4 text-sm sm:gap-6"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={openFilters}
                  aria-expanded={filtersOpen}
                  aria-controls="product-filters"
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
                aria-controls="product-sort-menu"
                className="inline-flex min-h-9 items-center bg-transparent px-0.5 font-medium text-[#142019] transition hover:opacity-60"
              >
                <span dir={isArabic ? "rtl" : "ltr"}>
                  {selectedSortLabel}
                </span>
              </button>

              {sortOpen && (
                <div
                  id="product-sort-menu"
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.15rem)] z-30 min-w-[190px] overflow-hidden border border-[#777] bg-white py-0 text-sm shadow-none"
                >
                  {[
                    ["default", isArabic ? "الترتيب الافتراضي" : "Default"],
                    ["bestsellers", isArabic ? "الأكثر مبيعاً أولاً" : "Bestsellers first"],
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
                          ? "bg-[#1558d6] text-white"
                          : "text-black hover:bg-[#eeeeee]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
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
          className="fixed inset-0 z-[999] bg-black/55"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelDraftFilters();
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
            dir={isArabic ? "rtl" : "ltr"}
            className="absolute inset-x-0 bottom-0 max-h-[76dvh] overflow-y-auto bg-white shadow-[0_-12px_50px_rgba(0,0,0,0.18)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[min(78vh,650px)] sm:w-[min(700px,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:shadow-[0_18px_70px_rgba(0,0,0,0.24)]"
          >
            <div className="flex min-h-full flex-col">
              <div
                dir="ltr"
                className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e5e5e5] bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <h2
                    id="product-filters-title"
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
                  onClick={cancelDraftFilters}
                  aria-label={
                    isArabic
                      ? "إغلاق"
                      : "Close"
                  }
                  className="flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-lg text-black transition hover:bg-[#f3f3f3]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 px-2 pb-4">
                {showCategories && (
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
                          setDraftCategoryIds([])
                        }
                        className={`border px-3 py-3 text-sm italic text-black transition ${
                          draftCategoryIds.length ===
                          0
                            ? "border-black bg-[#f1f1f1]"
                            : "border-transparent bg-[#f1f1f1] hover:border-[#888]"
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
                            draftCategoryIds.includes(
                              category.id
                            );

                          return (
                            <button
                              key={
                                category.id
                              }
                              type="button"
                              onClick={() =>
                                setDraftCategoryIds((current) =>
                                  current.includes(category.id)
                                    ? current.filter(
                                        (id) => id !== category.id
                                      )
                                    : [...current, category.id]
                                )
                              }
                              className={`border px-3 py-3 text-sm italic text-black transition ${
                                isSelected
                                  ? "border-black bg-[#f1f1f1]"
                                  : "border-transparent bg-[#f1f1f1] hover:border-[#888]"
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

                <section className="py-4">
                  <h3 className="mb-2 text-sm font-medium text-black">
                    {isArabic
                      ? "التوفر والعروض"
                      : "Availability & offers"}
                  </h3>

                  <div className="flex flex-wrap gap-0.5">
                    <label className={`cursor-pointer border px-3 py-3 text-sm italic text-black transition ${
                      draftInStockOnly
                        ? "border-black bg-[#f1f1f1]"
                        : "border-transparent bg-[#f1f1f1] hover:border-[#888]"
                    }`}>
                      <input
                        type="checkbox"
                        checked={draftInStockOnly}
                        onChange={() =>
                          setDraftInStockOnly(
                            (
                              current
                            ) =>
                              !current
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

                    <label className={`cursor-pointer border px-3 py-3 text-sm italic text-black transition ${
                      draftOnSaleOnly
                        ? "border-black bg-[#f1f1f1]"
                        : "border-transparent bg-[#f1f1f1] hover:border-[#888]"
                    }`}>
                      <input
                        type="checkbox"
                        checked={
                          draftOnSaleOnly
                        }
                        onChange={() =>
                          setDraftOnSaleOnly(
                            (
                              current
                            ) =>
                              !current
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

                  <div
                    dir="ltr"
                    className="mt-4 px-2"
                  >
                    <Slider
                      range
                      min={0}
                      max={
                        maxProductPrice
                      }
                      value={
                        draftPriceRange
                      }
                      onChange={(
                        value
                      ) =>
                        setDraftPriceRange(
                          value as number[]
                        )
                      }
                      className="kab-price-slider"
                    />

                    <div className="mt-2 flex items-center justify-between text-[10px] leading-none text-[#555]">
                      <span>
                        {draftPriceRange[0].toLocaleString()}{" "}
                        SYP
                      </span>

                      <span>
                        {draftPriceRange[1].toLocaleString()}{" "}
                        SYP
                      </span>
                    </div>
                  </div>
                </section>

              </div>

              <div className="sticky bottom-0 z-20 grid grid-cols-2 gap-3 bg-white px-2 pb-3 pt-2">
                <button
                  type="button"
                  onClick={cancelDraftFilters}
                  className="min-h-11 border-b border-black bg-white px-3 text-sm font-medium text-black transition hover:bg-[#f5f5f5]"
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={applyDraftFilters}
                  className="min-h-11 border-b border-r border-black bg-white px-3 text-sm font-medium text-black transition hover:bg-[#f5f5f5]"
                >
                  {isArabic
                    ? `تطبيق${draftFiltersCount ? ` (${draftFiltersCount})` : ""}`
                    : `Apply${draftFiltersCount ? ` (${draftFiltersCount} filters)` : ""}`}
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
