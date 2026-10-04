"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

/*
  "Where does this banner go when clicked?" picker for the admin panel.

  Instead of typing a link by hand, choose a destination type and then the
  page / product / brand / need / category. The component stores a normal
  site link (e.g. "/products/24"), which is what the storefront already uses,
  so existing banners keep working and old hand-typed links show up under
  "Custom link".
*/

type LinkType =
  | "page"
  | "product"
  | "brand"
  | "concern"
  | "category"
  | "custom";

type Option = {
  value: string;
  label: string;
};

type LinkOptions = {
  products: Option[];
  brands: Option[];
  concerns: Option[];
  categories: Option[];
};

const PAGE_OPTIONS: Option[] = [
  { value: "/", label: "Home" },
  { value: "/products", label: "All products" },
  { value: "/new-arrivals", label: "New arrivals" },
  { value: "/best-sellers", label: "Best sellers" },
  { value: "/brands", label: "Brands" },
  { value: "/about", label: "About us" },
  { value: "/contact", label: "Contact us" },
];

const TYPE_OPTIONS: Array<{ value: LinkType; label: string }> = [
  { value: "page", label: "A page" },
  { value: "product", label: "A product" },
  { value: "brand", label: "A brand" },
  { value: "concern", label: "A shop-by-need page" },
  { value: "category", label: "A category" },
  { value: "custom", label: "Custom link" },
];

type NamedRow = {
  id?: number | string | null;
  slug?: string | null;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  categories?: NamedRow | null;
  brands?: NamedRow | null;
};

function rowName(row: NamedRow | null | undefined) {
  return row?.name_en || row?.name || row?.name_ar || "";
}

// Loaded once and shared by every picker on the page.
let optionsPromise: Promise<LinkOptions> | null = null;

function loadLinkOptions() {
  optionsPromise ||= Promise.all([
    supabase
      .from("products")
      .select("id, name, name_ar, name_en, categories (name, name_ar, name_en)")
      .order("id", { ascending: false }),
    supabase
      .from("brands")
      .select("id, slug, name, name_ar, name_en")
      .order("id", { ascending: true }),
    supabase
      .from("concerns")
      .select("id, name_ar, name_en")
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, name_ar, name_en, brands (name, name_ar, name_en)")
      .order("id", { ascending: true }),
  ])
    .then(([products, brands, concerns, categories]) => {
      const productRows = (products.data || []) as unknown as NamedRow[];
      const brandRows = (brands.data || []) as unknown as NamedRow[];
      const concernRows = (concerns.data || []) as unknown as NamedRow[];
      const categoryRows = (categories.data || []) as unknown as NamedRow[];

      return {
        products: productRows.map((product) => {
          const category = rowName(product.categories);
          return {
            value: `/products/${product.id}`,
            label: `${rowName(product) || `#${product.id}`}${
              category ? ` — ${category}` : ""
            }`,
          };
        }),

        brands: brandRows
          .filter((brand) => brand.slug)
          .map((brand) => ({
            value: `/brands/${brand.slug}`,
            label: rowName(brand) || String(brand.slug),
          })),

        concerns: concernRows.map((concern) => ({
          value: `/shop-by-need/${concern.id}`,
          label: rowName(concern) || `#${concern.id}`,
        })),

        categories: categoryRows.map((category) => {
          const brand = rowName(category.brands);
          return {
            value: `/products?category=${category.id}`,
            label: `${rowName(category) || `#${category.id}`}${
              brand ? ` — ${brand}` : ""
            }`,
          };
        }),
      };
    })
    .catch(() => {
      optionsPromise = null;
      return { products: [], brands: [], concerns: [], categories: [] };
    });

  return optionsPromise;
}

/** Which kind of destination a stored link is. */
function detectType(value: string): LinkType {
  const link = value.trim();

  if (PAGE_OPTIONS.some((page) => page.value === link)) return "page";
  if (/^\/products\/\d+$/.test(link)) return "product";
  if (/^\/brands\/[^/?#]+$/.test(link)) return "brand";
  if (/^\/shop-by-need\/\d+$/.test(link)) return "concern";
  if (/^\/products\?category=\d+$/.test(link)) return "category";

  return "custom";
}

const FIELD_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-black outline-none transition focus:border-[#0a583b] focus:bg-white";

export default function BannerLinkPicker({
  value,
  onChange,
  label = "When clicked, go to",
  fallbackLabel,
  className = "",
}: {
  /** The stored link, e.g. "/products/24". Empty = use the default. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** Shown when nothing is chosen, e.g. "All products". */
  fallbackLabel?: string;
  className?: string;
}) {
  const [options, setOptions] = useState<LinkOptions | null>(null);

  // The type follows the stored link. The admin's own choice only matters
  // while nothing is picked yet, or when they asked for a custom link.
  const [chosenType, setChosenType] = useState<LinkType | null>(null);
  const type: LinkType = value.trim()
    ? chosenType === "custom"
      ? "custom"
      : detectType(value)
    : chosenType ?? "page";

  useEffect(() => {
    let cancelled = false;

    void loadLinkOptions().then((loaded) => {
      if (!cancelled) setOptions(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const targetOptions = useMemo<Option[]>(() => {
    if (type === "page") return PAGE_OPTIONS;
    if (!options) return [];
    if (type === "product") return options.products;
    if (type === "brand") return options.brands;
    if (type === "concern") return options.concerns;
    if (type === "category") return options.categories;
    return [];
  }, [options, type]);

  const currentValue = value.trim();
  const valueIsListed = targetOptions.some(
    (option) => option.value === currentValue
  );

  function changeType(nextType: LinkType) {
    setChosenType(nextType);

    // Keep the current link when it already matches the new type.
    if (nextType === "custom" || detectType(currentValue) === nextType) {
      return;
    }

    // Pages have a sensible first choice; for the others wait for a pick.
    onChange(nextType === "page" ? PAGE_OPTIONS[1].value : "");
  }

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-extrabold text-[#142019]">{label}</p>

      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <select
          aria-label="Link type"
          value={type}
          onChange={(event) => changeType(event.target.value as LinkType)}
          className={FIELD_CLASS}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {type === "custom" ? (
          <input
            type="text"
            aria-label="Custom link"
            dir="ltr"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/products/24 or https://..."
            className={FIELD_CLASS}
          />
        ) : (
          <select
            aria-label="Link target"
            value={valueIsListed ? currentValue : ""}
            onChange={(event) => onChange(event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">
              {type !== "page" && !options
                ? "Loading..."
                : targetOptions.length === 0
                  ? "Nothing to choose yet"
                  : "Choose..."}
            </option>

            {targetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="mt-2 text-xs leading-5 text-[#647168]">
        {currentValue ? (
          <>
            Link: <span dir="ltr" className="font-bold">{currentValue}</span>
          </>
        ) : fallbackLabel ? (
          <>Nothing chosen yet. It will go to {fallbackLabel}.</>
        ) : (
          <>Nothing chosen yet.</>
        )}
      </p>
    </div>
  );
}
