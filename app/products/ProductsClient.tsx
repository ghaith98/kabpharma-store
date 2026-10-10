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
import { trackSearch } from "@/lib/analytics";
import EditorialProductCard from "./EditorialProductCard";
import NewArrivalsBanner from "../NewArrivalsBanner";
import RoutineBanner from "./RoutineBanner";
import {
  isRestoringNavigation,
  readPageNumber,
  writePageNumber,
} from "@/lib/navigation-memory";
import {
  DiscoveryTile,
  type DiscoveryBanner,
} from "../new-arrivals/NewArrivalsCollection";
import type {
  EditorialProduct,
} from "./EditorialProductCard";
import { getPromotions, productHasOffer } from "./[id]/ProductPromotionNotice";
import { useLiveFlashSales } from "@/lib/use-live-flash-sales";

const PRODUCTS_PAGE_SIZE = 16;
const COLLECTION_PAGE_SIZE = 24;

type FilterBrand = {
  id: number;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

type ProductsClientProps = {
  products: EditorialProduct[];
  brands?: FilterBrand[];
  showSearch?: boolean;
  showCategories?: boolean;
  bestSellerIds?: number[];
  showHeader?: boolean;
  standaloneCollection?: boolean;
  // Show Filter & Sort. Defaults to on for the products page and off for
  // collection pages; brand pages turn it on for their own products.
  enableFilters?: boolean;
  standaloneNewArrivalsLayout?: boolean;
  productHrefSuffix?: string;
  collectionDiscoveryBanner?: DiscoveryBanner | null;
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

function normalizeSearchText(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export default function ProductsClient({
  products: serverProducts,
  showSearch = false,
  showCategories = true,
  showHeader = true,
  bestSellerIds = [],
  standaloneCollection = false,
  enableFilters,
  standaloneNewArrivalsLayout = false,
  productHrefSuffix = "",
  collectionDiscoveryBanner = null,
  concern = null,
  brands = [],
}: ProductsClientProps) {
  const searchParams = useSearchParams();
  const { lang } = useLanguage();

  // A flash-sale price goes back to normal the moment the sale ends.
  const products = useLiveFlashSales(serverProducts);
  const pageSize = standaloneCollection ? COLLECTION_PAGE_SIZE : PRODUCTS_PAGE_SIZE;

  const isArabic = lang === "ar";

  const maxProductPrice = useMemo(() => {
    return Math.max(
      0,
      ...products.map((product) =>
        Number(product.price || 0)
      )
    );
  }, [products]);

  const filtersEnabled =
    enableFilters ?? !standaloneCollection;

  const search = standaloneCollection
    ? ""
    : searchParams.get("search") || "";

  useEffect(() => {
    if (search) trackSearch(search);
  }, [search]);
  const selectedCategoryIds = useMemo(
    () =>
      filtersEnabled
        ? parseCategoryIds(
            searchParams.get("category")
          )
        : [],
    [searchParams, filtersEnabled]
  );
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

  const [selectedBrandIds, setSelectedBrandIds] =
    useState<number[]>([]);

  const [draftBrandIds, setDraftBrandIds] =
    useState<number[]>([]);

  // Products that currently have an offer (e.g. 2nd at half price), so
  // "Offers & sale" includes them, not only products with a sale %.
  const [promotedProductIds, setPromotedProductIds] =
    useState<Set<number>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    void getPromotions().then((items) => {
      if (cancelled) return;
      // Offers can be for one product, a category, a brand or everything.
      setPromotedProductIds(
        new Set(
          products
            .filter((product) =>
              productHasOffer(items, {
                productId: Number(product.id),
                categoryId: product.category_id,
                brandId: product.brand_id,
              })
            )
            .map((product) => Number(product.id))
        )
      );
    });

    return () => {
      cancelled = true;
    };
  }, [products]);

  const [draftCategoryIds, setDraftCategoryIds] =
    useState<number[]>(selectedCategoryIds);
  const [draftPriceRange, setDraftPriceRange] =
    useState<number[]>(priceRange);
  const [draftInStockOnly, setDraftInStockOnly] =
    useState(inStockOnly);
  const [draftOnSaleOnly, setDraftOnSaleOnly] =
    useState(onSaleOnly);

  const cancelDraftFilters = useCallback(() => {
    setDraftCategoryIds(selectedCategoryIds);
    setDraftBrandIds(selectedBrandIds);
    setDraftPriceRange([...priceRange]);
    setDraftInStockOnly(inStockOnly);
    setDraftOnSaleOnly(onSaleOnly);
    setFiltersOpen(false);
  }, [
    inStockOnly,
    onSaleOnly,
    priceRange,
    selectedBrandIds,
    selectedCategoryIds,
  ]);

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
  }, [cancelDraftFilters, filtersOpen]);

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
      setSelectedBrandIds([]);
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
        brand_id?: number | null;
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

          brand_id:
            product.categories.brand_id ??
            product.brand_id ??
            null,
        }
      );
    });

    return Array.from(
      categoryMap.values()
    );
  }, [products]);

  // Brands that actually have products in this list, in admin order.
  const brandOptions = useMemo(() => {
    const presentBrandIds = new Set(
      products
        .map((product) =>
          Number(
            product.brand_id ??
              product.categories?.brand_id
          )
        )
        .filter((id) => Number.isFinite(id))
    );

    return brands.filter((brand) =>
      presentBrandIds.has(Number(brand.id))
    );
  }, [brands, products]);

  function brandLabel(brand: FilterBrand) {
    return (
      (isArabic
        ? brand.name_ar || brand.name || brand.name_en
        : brand.name_en || brand.name || brand.name_ar) || ""
    );
  }

  function toggleDraftBrand(brandId: number) {
    const nextBrandIds = draftBrandIds.includes(brandId)
      ? draftBrandIds.filter((id) => id !== brandId)
      : [...draftBrandIds, brandId];

    setDraftBrandIds(nextBrandIds);

    // Drop chosen categories that belong to brands no longer selected.
    if (nextBrandIds.length > 0) {
      setDraftCategoryIds((current) =>
        current.filter((categoryId) => {
          const category = categories.find(
            (candidate) => candidate.id === categoryId
          );
          return (
            !category?.brand_id ||
            nextBrandIds.includes(Number(category.brand_id))
          );
        })
      );
    }
  }

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
    setSelectedBrandIds([]);
  }

  function openFilters() {
    setDraftCategoryIds(selectedCategoryIds);
    setDraftBrandIds(selectedBrandIds);
    setDraftPriceRange([...priceRange]);
    setDraftInStockOnly(inStockOnly);
    setDraftOnSaleOnly(onSaleOnly);
    setSortOpen(false);
    setFiltersOpen(true);
  }

  function applyDraftFilters() {
    replaceProductParams({
      categoryIds: draftCategoryIds,
    });
    setSelectedBrandIds(draftBrandIds);
    setPriceRange([...draftPriceRange]);
    setInStockOnly(draftInStockOnly);
    setOnSaleOnly(draftOnSaleOnly);
    setFiltersOpen(false);
  }

  const draftFiltersCount =
    draftCategoryIds.length +
    draftBrandIds.length +
    (draftInStockOnly ? 1 : 0) +
    (draftOnSaleOnly ? 1 : 0) +
    (draftPriceRange[0] > 0 ||
    draftPriceRange[1] < maxProductPrice
      ? 1
      : 0);

  const activeFiltersCount =
    selectedCategoryIds.length +
    selectedBrandIds.length +
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
        const cleanSearch =
          normalizeSearchText(search);

        return [...products]
          .filter((product) => {
            const searchableText =
              normalizeSearchText(`
                ${product.name || ""}
                ${product.name_ar || ""}
                ${product.name_en || ""}
                ${product.description || ""}
                ${product.description_ar || ""}
                ${product.description_en || ""}
                ${product.categories?.name || ""}
                ${product.categories?.name_ar || ""}
                ${product.categories?.name_en || ""}
              `);

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

            const matchesBrand =
              selectedBrandIds.length === 0 ||
              selectedBrandIds.includes(
                Number(
                  product.brand_id ??
                    product.categories?.brand_id
                )
              );

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
              ) > 0 ||
              promotedProductIds.has(
                Number(product.id)
              );

            return (
              matchesSearch &&
              matchesBrand &&
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
          selectedCategoryIds,
          selectedBrandIds,
          selectedIds,
          priceRange,
          inStockOnly,
          onSaleOnly,
          promotedProductIds,
          sortBy,
          bestSellerIds,
        ]);

      /*
        Incremental rendering ("load more").
        Filtering and sorting still run over the whole catalog instantly, but
        only the first batch of matching cards is mounted. All Products adds
        another 16 only when "Load More" is clicked; standalone collections
        keep their existing automatic loading.
        The page resets to the first batch whenever the filtered result
        changes. Stored with the result key so no effect/setState is needed.
      */
      const resultKey = useMemo(
        () => filteredProducts.map((product) => product.id).join(","),
        [filteredProducts]
      );

      const [pageState, setPageState] = useState({
        key: resultKey,
        count: pageSize,
      });

      const visibleCount =
        pageState.key === resultKey
          ? pageState.count
          : pageSize;

      const visibleProducts = filteredProducts.slice(0, visibleCount);
      const remainingCount = filteredProducts.length - visibleProducts.length;

      const showMore = useCallback(() => {
        setPageState((current) => ({
          key: resultKey,
          count:
            (current.key === resultKey
              ? current.count
              : pageSize) + pageSize,
        }));
      }, [resultKey, pageSize]);

      // Back from a product: show as many products as were open before,
      // so the page is tall enough to return to the same spot.
      useEffect(() => {
        if (!isRestoringNavigation()) return;

        const savedCount = readPageNumber("kab_products_shown:");
        if (savedCount <= pageSize) return;

        const timer = window.setTimeout(() => {
          setPageState({ key: resultKey, count: savedCount });
        }, 0);

        return () => window.clearTimeout(timer);
        // Only on arrival; later changes follow the normal flow.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      useEffect(() => {
        writePageNumber("kab_products_shown:", visibleCount);
      }, [visibleCount]);

      const loadMoreRef = useRef<HTMLDivElement | null>(null);

      useEffect(() => {
        if (!standaloneCollection) return;
        const sentinel = loadMoreRef.current;
        if (!sentinel || remainingCount <= 0) return;
        if (typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              showMore();
            }
          },
          { rootMargin: "600px 0px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
      }, [remainingCount, showMore, standaloneCollection]);

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

          {filtersEnabled && (
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
                  className="absolute right-0 top-[calc(100%+0.15rem)] z-30 min-w-[190px] overflow-hidden border border-[#dfe4e0] bg-white py-0 text-sm shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
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
              {standaloneCollection &&
              (!filtersEnabled || activeFiltersCount === 0)
                ? isArabic
                  ? "سيتم إضافة منتجات مختارة لهذه الحاجة قريباً."
                  : "Curated products for this need will be added soon."
                : isArabic
                  ? "جرّب تغيير البحث أو إزالة بعض خيارات التصفية."
                  : "Try changing your search or removing some filters."}
            </p>

            {filtersEnabled &&
              (!standaloneCollection || activeFiltersCount > 0) && (
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
        <div dir={standaloneCollection && collectionDiscoveryBanner ? "ltr" : undefined} className={`grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 ${standaloneNewArrivalsLayout ? "lg:grid-cols-4 lg:gap-x-8" : "lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4"}`}>
  {visibleProducts.map(
    (product, index) => (
      <Fragment key={product.id}>
        <EditorialProductCard
          product={product}
          productHref={`/products/${product.id}${productHrefSuffix}`}
          headingLevel={2}
          eagerImage={index < 4}
          imageSizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {!standaloneCollection && index === 3 && (
            <div className="col-span-full my-2">
              <RoutineBanner />
            </div>
          )}

        {standaloneCollection && collectionDiscoveryBanner && index === 1 && (
          <div className="col-span-2">
            <DiscoveryTile banner={collectionDiscoveryBanner} />
          </div>
        )}
      </Fragment>
    )
  )}
</div>
      )}

      {remainingCount > 0 && (
        <div
          ref={loadMoreRef}
          className="mt-12 mb-8 flex justify-center sm:mt-16"
        >
          <button
            type="button"
            onClick={showMore}
            className="min-h-11 rounded-full border border-[#142019] bg-white px-7 py-2.5 text-sm font-medium text-[#142019] transition hover:bg-[#142019] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#142019] focus-visible:ring-offset-4"
          >
            {isArabic
              ? "عرض المزيد"
              : "Load More"}
          </button>
        </div>
      )}

      {filtersEnabled && filtersOpen && (
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
                className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ebe8] bg-white px-3 py-2"
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
                  className="flex h-11 w-11 items-center justify-center border-2 border-[#dfe4e0] bg-white text-lg text-[#142019] transition hover:bg-[#edf5f0]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 px-2 pb-4">
                {showCategories && brandOptions.length > 1 && (
                  <section className="py-4">
                    <h3 className="mb-2 text-sm font-medium text-black">
                      {isArabic
                        ? "الماركة"
                        : "Brand"}
                    </h3>

                    <div className="flex flex-wrap gap-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setDraftBrandIds([])
                        }
                        className={`border px-3 py-3 text-sm italic transition ${
                          draftBrandIds.length === 0
                            ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                            : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                        }`}
                      >
                        {isArabic
                          ? "الكل"
                          : "All"}
                      </button>

                      {brandOptions.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          aria-pressed={draftBrandIds.includes(Number(brand.id))}
                          onClick={() =>
                            toggleDraftBrand(Number(brand.id))
                          }
                          className={`border px-3 py-3 text-sm italic transition ${
                            draftBrandIds.includes(Number(brand.id))
                              ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                              : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                          }`}
                        >
                          {brandLabel(brand)}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {showCategories && (() => {
                  // Only the chosen brands' categories; grouped under each
                  // brand's name when more than one brand is shown.
                  const visibleCategories =
                    draftBrandIds.length > 0
                      ? categories.filter((category) =>
                          draftBrandIds.includes(
                            Number(category.brand_id)
                          )
                        )
                      : categories;

                  const groups = [
                    ...brandOptions.map((brand) => ({
                      key: `brand-${brand.id}`,
                      title: brandLabel(brand),
                      items: visibleCategories.filter(
                        (category) =>
                          Number(category.brand_id) ===
                          Number(brand.id)
                      ),
                    })),
                    {
                      key: "other",
                      title: "",
                      items: visibleCategories.filter(
                        (category) =>
                          !brandOptions.some(
                            (brand) =>
                              Number(brand.id) ===
                              Number(category.brand_id)
                          )
                      ),
                    },
                  ].filter((group) => group.items.length > 0);

                  const showGroupTitles = groups.length > 1;

                  return (
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
                          className={`border px-3 py-3 text-sm italic transition ${
                            draftCategoryIds.length === 0
                              ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                              : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                          }`}
                        >
                          {isArabic
                            ? "الكل"
                            : "All"}
                        </button>
                      </div>

                      {groups.map((group) => (
                        <div key={group.key} className="mt-3">
                          {showGroupTitles && group.title && (
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a857e]">
                              {group.title}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-0.5">
                            {group.items.map((category) => {
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
                                  key={category.id}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    setDraftCategoryIds((current) =>
                                      current.includes(category.id)
                                        ? current.filter(
                                            (id) => id !== category.id
                                          )
                                        : [...current, category.id]
                                    )
                                  }
                                  className={`border px-3 py-3 text-sm italic transition ${
                                    isSelected
                                      ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                                      : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
                                  }`}
                                >
                                  {categoryLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </section>
                  );
                })()}

                <section className="py-4">
                  <h3 className="mb-2 text-sm font-medium text-black">
                    {isArabic
                      ? "التوفر والعروض"
                      : "Availability & offers"}
                  </h3>

                  <div className="flex flex-wrap gap-0.5">
                    <label className={`cursor-pointer border px-3 py-3 text-sm italic transition ${
                      draftInStockOnly
                        ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                        : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
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

                    <label className={`cursor-pointer border px-3 py-3 text-sm italic transition ${
                      draftOnSaleOnly
                        ? "border-[#0a583b] bg-[#edf5f0] text-[#0a583b]"
                        : "border-transparent bg-[#f5f7f5] text-[#142019] hover:border-[#0a583b]/40"
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
                          ? "عروض وتخفيضات"
                          : "Offers & sale"}
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
                  className="min-h-11 border border-[#c5cdc7] border-b-[3px] border-b-[#a8b3ab] bg-[#f5f7f5] px-3 text-sm font-medium text-[#142019] transition hover:brightness-[0.97] active:border-b active:mt-[2px]"
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>

                <button
                  type="button"
                  onClick={applyDraftFilters}
                  className="min-h-11 border border-[#0a583b] border-b-[3px] border-b-[#063a28] bg-[#0a583b] px-3 text-sm font-semibold text-white transition hover:brightness-[0.95] active:border-b active:mt-[2px]"
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
