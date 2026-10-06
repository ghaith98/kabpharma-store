"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { hasMainSize } from "@/lib/product-options";
import {
  normalizePromotionRow,
  promotionDescription,
  promotionLabel,
  promotionStatus,
  type PromotionKind,
  type PromotionRule,
  type PromotionScope,
  type PromotionStatus,
} from "@/lib/pricing/rules";
import { supabase } from "@/lib/supabase";

/*
  Admin > Promotions.

  Build an automatic offer in four steps: the type, what it applies to,
  the numbers, and when it runs. The preview shows the exact words
  customers will see. Prices themselves are always calculated on the
  server, from the same rules shown here.
*/

type Product = {
  id: number;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
  sale_percent: number | null;
  is_out_of_stock: boolean | null;
  brand_id: number | null;
  category_id: number | null;
  size_ar: string | null;
  size_en: string | null;
};

type Named = {
  id: number;
  name: string | null;
  name_ar: string | null;
  name_en: string | null;
  brand_id?: number | null;
};

type Variant = {
  id: number;
  product_id: number;
  label_ar: string | null;
  label_en: string | null;
};

type PromotionRow = Record<string, unknown> & { id: string };

type TierDraft = { minQuantity: string; percent: string };

type Draft = {
  id: string | null;
  kind: PromotionKind;
  scope: PromotionScope;
  productId: string;
  categoryId: string;
  brandId: string;
  allSizes: boolean;
  includeMainSize: boolean;
  variantIds: number[];
  buyQuantity: string;
  getQuantity: string;
  discountPercent: string;
  tiers: TierDraft[];
  minimumOrderAmount: string;
  maxUsesPerOrder: string;
  allowWithCoupon: boolean;
  startsAt: string;
  endsAt: string;
  labelAr: string;
  labelEn: string;
  name: string;
};

const KIND_OPTIONS: Array<{
  kind: PromotionKind;
  title: string;
  example: string;
}> = [
  {
    kind: "buy_x_get_y",
    title: "Buy X, get Y",
    example: "Buy 2 get 1 free · Buy 1, 2nd at 50% off",
  },
  {
    kind: "quantity_discount",
    title: "Quantity discount",
    example: "Buy 2 or more, save 10% on each",
  },
  {
    kind: "flash_sale",
    title: "Flash sale",
    example: "20% off until Friday, with a countdown",
  },
  {
    kind: "free_delivery",
    title: "Free delivery",
    example: "Free delivery this weekend",
  },
];

const SCOPE_OPTIONS: Array<{ scope: PromotionScope; title: string }> = [
  { scope: "product", title: "One product" },
  { scope: "category", title: "A category" },
  { scope: "brand", title: "A brand" },
  { scope: "all", title: "All products" },
];

const STATUS_STYLE: Record<PromotionStatus, { label: string; className: string }> = {
  active: { label: "Running", className: "bg-emerald-50 text-emerald-700" },
  scheduled: { label: "Scheduled", className: "bg-sky-50 text-sky-700" },
  paused: { label: "Paused", className: "bg-gray-100 text-gray-600" },
  ended: { label: "Ended", className: "bg-amber-50 text-amber-700" },
};

const FIELD =
  "w-full rounded-xl border border-[#d5dcd7] bg-white px-3 py-2.5 text-sm text-[#142019] outline-none transition focus:border-[#0a583b]";

const NUMBER_FIELD =
  "w-20 rounded-xl border border-[#d5dcd7] bg-white px-3 py-2.5 text-center text-sm font-extrabold text-[#142019] outline-none transition focus:border-[#0a583b]";

/** datetime-local value (the admin's own time zone) for a moment. */
function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function emptyDraft(): Draft {
  return {
    id: null,
    kind: "buy_x_get_y",
    scope: "product",
    productId: "",
    categoryId: "",
    brandId: "",
    allSizes: true,
    includeMainSize: false,
    variantIds: [],
    buyQuantity: "2",
    getQuantity: "1",
    discountPercent: "100",
    tiers: [{ minQuantity: "2", percent: "10" }],
    minimumOrderAmount: "",
    maxUsesPerOrder: "",
    allowWithCoupon: false,
    startsAt: "",
    endsAt: "",
    labelAr: "",
    labelEn: "",
    name: "",
  };
}

function draftFromRule(rule: PromotionRule): Draft {
  return {
    id: rule.id,
    kind: rule.kind,
    scope: rule.scope,
    productId: rule.productId ? String(rule.productId) : "",
    categoryId: rule.categoryId ? String(rule.categoryId) : "",
    brandId: rule.brandId ? String(rule.brandId) : "",
    allSizes: rule.allSizes,
    includeMainSize: rule.includeMainSize,
    variantIds: rule.variantIds,
    buyQuantity: String(rule.buyQuantity || 2),
    getQuantity: String(rule.getQuantity || 1),
    discountPercent: rule.discountPercent
      ? String(rule.discountPercent)
      : rule.kind === "flash_sale"
        ? "20"
        : "100",
    tiers: rule.tiers.length
      ? rule.tiers.map((tier) => ({
          minQuantity: String(tier.minQuantity),
          percent: String(tier.percent),
        }))
      : [{ minQuantity: "2", percent: "10" }],
    minimumOrderAmount: rule.minimumOrderAmount
      ? String(rule.minimumOrderAmount)
      : "",
    maxUsesPerOrder: rule.maxUsesPerOrder
      ? String(rule.maxUsesPerOrder)
      : "",
    allowWithCoupon: rule.allowWithCoupon,
    startsAt: toLocalInput(rule.startsAt),
    endsAt: toLocalInput(rule.endsAt),
    labelAr: rule.labelAr || "",
    labelEn: rule.labelEn || "",
    name: rule.name || "",
  };
}

/** What is sent to the server, and what the preview is built from. */
function draftPayload(draft: Draft) {
  return {
    id: draft.id,
    kind: draft.kind,
    scope: draft.kind === "free_delivery" ? "all" : draft.scope,
    productId: Number(draft.productId) || null,
    categoryId: Number(draft.categoryId) || null,
    brandId: Number(draft.brandId) || null,
    allSizes: draft.kind === "flash_sale" ? true : draft.allSizes,
    includeMainSize: draft.includeMainSize,
    variantIds: draft.variantIds,
    buyQuantity: Number(draft.buyQuantity),
    getQuantity: Number(draft.getQuantity),
    discountPercent: Number(draft.discountPercent),
    tiers: draft.tiers.map((tier) => ({
      minQuantity: Number(tier.minQuantity),
      percent: Number(tier.percent),
    })),
    minimumOrderAmount: Number(draft.minimumOrderAmount || 0),
    maxUsesPerOrder: draft.maxUsesPerOrder
      ? Number(draft.maxUsesPerOrder)
      : null,
    allowWithCoupon: draft.allowWithCoupon,
    startsAt: fromLocalInput(draft.startsAt),
    endsAt: fromLocalInput(draft.endsAt),
    labelAr: draft.labelAr,
    labelEn: draft.labelEn,
    name: draft.name,
  };
}

/** The draft as the price calculator would read it (null = incomplete). */
function draftRule(draft: Draft): PromotionRule | null {
  const payload = draftPayload(draft);

  return normalizePromotionRow({
    id: draft.id || "draft",
    name: draft.name,
    type: payload.kind,
    scope: payload.scope,
    // Any id is enough for the preview's wording.
    target_product_id: payload.productId || 1,
    category_id: payload.categoryId || 1,
    brand_id: payload.brandId || 1,
    all_sizes: payload.allSizes,
    include_main_size: payload.includeMainSize,
    variant_ids: payload.variantIds,
    buy_quantity: payload.buyQuantity,
    get_quantity: payload.getQuantity,
    discount_percent: payload.discountPercent,
    tiers: payload.tiers,
    minimum_order_amount: payload.minimumOrderAmount,
    label_ar: draft.labelAr,
    label_en: draft.labelEn,
    is_active: true,
  });
}

function displayName(item: {
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
} | null | undefined) {
  return item?.name_en || item?.name || item?.name_ar || "";
}

export default function PromotionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Named[]>([]);
  const [categories, setCategories] = useState<Named[]>([]);
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [productBrandFilter, setProductBrandFilter] = useState("all");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantsFor, setVariantsFor] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  const headers = useCallback(async () => {
    const { data } = await supabase.auth.getSession();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token || ""}`,
    };
  }, []);

  const load = useCallback(async () => {
    const [productsResult, brandsResult, categoriesResult, requestHeaders] =
      await Promise.all([
        supabase
          .from("products")
          .select(
            "id,name,name_ar,name_en,sale_percent,is_out_of_stock,brand_id,category_id,size_ar,size_en"
          )
          .order("name_en"),
        supabase.from("brands").select("id,name,name_ar,name_en").order("id"),
        supabase
          .from("categories")
          .select("id,name,name_ar,name_en,brand_id")
          .order("id"),
        headers(),
      ]);

    if (!productsResult.error) setProducts(productsResult.data || []);
    if (!brandsResult.error) setBrands(brandsResult.data || []);
    if (!categoriesResult.error) setCategories(categoriesResult.data || []);

    const response = await fetch("/api/admin/promotions", {
      headers: requestHeaders,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    if (response.ok) setRows(result?.promotions || []);

    setNowMs(Date.now());
    setLoaded(true);
  }, [headers]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Keep "Running / Scheduled / Ended" correct while the page stays open.
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // The chosen product's sizes.
  const sizeProductId =
    draft.scope === "product" && draft.kind !== "free_delivery"
      ? draft.productId
      : "";

  useEffect(() => {
    if (!sizeProductId) return;

    let cancelled = false;

    void headers()
      .then((requestHeaders) =>
        fetch(`/api/admin/promotions?productId=${Number(sizeProductId)}`, {
          headers: requestHeaders,
          cache: "no-store",
        })
      )
      .then(async (response) => ({
        ok: response.ok,
        result: await response.json().catch(() => null),
      }))
      .then(({ ok, result }) => {
        if (cancelled) return;
        setVariants(ok ? result?.variants || [] : []);
        setVariantsFor(sizeProductId);
      })
      .catch(() => {
        if (cancelled) return;
        setVariants([]);
        setVariantsFor(sizeProductId);
      });

    return () => {
      cancelled = true;
    };
  }, [headers, sizeProductId]);

  const sizesLoading = Boolean(sizeProductId) && variantsFor !== sizeProductId;
  const productVariants = sizesLoading ? [] : variants;

  const selectedProduct =
    products.find((product) => String(product.id) === draft.productId) ||
    null;

  // "The product itself" is a size choice when it has a main size, or when
  // it has no other sizes.
  const productIsAChoice =
    selectedProduct != null &&
    (productVariants.length === 0 || hasMainSize(selectedProduct));

  const brandName = useCallback(
    (id: number | null | undefined) =>
      displayName(brands.find((brand) => brand.id === id)),
    [brands]
  );

  const productOptions = products.filter(
    (product) =>
      productBrandFilter === "all" ||
      String(product.brand_id) === productBrandFilter
  );

  const previewRule = useMemo(() => draftRule(draft), [draft]);

  function update(values: Partial<Draft>) {
    setFormError("");
    setDraft((current) => ({ ...current, ...values }));
  }

  function chooseKind(kind: PromotionKind) {
    update({
      kind,
      // Sensible starting numbers for each type.
      discountPercent:
        kind === "flash_sale"
          ? draft.kind === "flash_sale"
            ? draft.discountPercent
            : "20"
          : draft.kind === "buy_x_get_y"
            ? draft.discountPercent
            : "100",
    });
  }

  function openNew() {
    setDraft(emptyDraft());
    setProductBrandFilter("all");
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(rule: PromotionRule) {
    setDraft(draftFromRule(rule));
    setProductBrandFilter("all");
    setFormError("");
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setFormOpen(false);
    setFormError("");
    setDraft(emptyDraft());
  }

  function toggleVariant(id: number) {
    update({
      variantIds: draft.variantIds.includes(id)
        ? draft.variantIds.filter((item) => item !== id)
        : [...draft.variantIds, id],
    });
  }

  function updateTier(index: number, values: Partial<TierDraft>) {
    update({
      tiers: draft.tiers.map((tier, position) =>
        position === index ? { ...tier, ...values } : tier
      ),
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setFormError("");

    const response = await fetch("/api/admin/promotions", {
      method: draft.id ? "PUT" : "POST",
      headers: await headers(),
      body: JSON.stringify(draftPayload(draft)),
    });
    const result = await response.json().catch(() => null);

    setSaving(false);

    if (!response.ok) {
      setFormError(result?.error || "Could not save the promotion.");
      return;
    }

    closeForm();
    await load();
  }

  async function setActive(id: string, isActive: boolean) {
    setWorkingId(id);

    const response = await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: await headers(),
      body: JSON.stringify({ ids: [id], isActive }),
    });

    setWorkingId(null);

    if (!response.ok) {
      alert("Could not update the promotion.");
      return;
    }

    await load();
  }

  async function remove(id: string, label: string) {
    if (
      !window.confirm(
        `Delete "${label}"?\nOnly the promotion is deleted. Products and past orders are not changed.`
      )
    ) {
      return;
    }

    setWorkingId(id);

    const response = await fetch("/api/admin/promotions", {
      method: "DELETE",
      headers: await headers(),
      body: JSON.stringify({ ids: [id] }),
    });

    setWorkingId(null);

    if (!response.ok) {
      alert("Could not delete the promotion.");
      return;
    }

    if (draft.id === id) closeForm();
    await load();
  }

  /** "Glucoflex Serum · 30 ml, 50 ml" */
  function targetText(rule: PromotionRule) {
    if (rule.kind === "free_delivery") return "Every order";
    if (rule.scope === "all") return "All products";
    if (rule.scope === "brand") return `Brand: ${brandName(rule.brandId) || "—"}`;

    if (rule.scope === "category") {
      const category = categories.find((item) => item.id === rule.categoryId);
      const brand = brandName(category?.brand_id);

      return `Category: ${displayName(category) || "—"}${brand ? ` (${brand})` : ""}`;
    }

    const product = products.find((item) => item.id === rule.productId);
    const name = displayName(product) || "Deleted product";

    if (rule.allSizes) return `${name} · all sizes`;

    const sizeCount = rule.variantIds.length + (rule.includeMainSize ? 1 : 0);

    return `${name} · ${sizeCount} ${sizeCount === 1 ? "size" : "sizes"}`;
  }

  const promotions = useMemo(
    () =>
      rows.map((row) => ({
        row,
        rule: normalizePromotionRow(row),
      })),
    [rows]
  );

  const isItemOffer =
    draft.kind === "buy_x_get_y" || draft.kind === "quantity_discount";

  return (
    <main className="min-h-screen bg-[#f7f8f6] p-4 sm:p-7">
      <div className="mx-auto max-w-5xl">
        <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
              Marketing
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#142019]">
              Promotions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647168]">
              Automatic offers. They apply by themselves in the cart, without a
              code. An item gets one offer at a time: the one that saves the
              customer the most. Items on sale are not included in &quot;buy X
              get Y&quot; or quantity offers.
            </p>
          </div>

          {!formOpen && (
            <button
              type="button"
              onClick={openNew}
              className="rounded-xl bg-[#0a583b] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
            >
              New promotion
            </button>
          )}
        </section>

        {formOpen && (
          <form
            onSubmit={save}
            className="mb-8 rounded-[1.5rem] border border-[#e1e8e3] bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-extrabold text-[#142019]">
                {draft.id ? "Edit promotion" : "New promotion"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#647168] hover:bg-[#f1f4f1]"
              >
                Cancel
              </button>
            </div>

            {/* 1. Type */}
            <fieldset className="mt-6">
              <legend className="text-sm font-extrabold text-[#142019]">
                1. Type
              </legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {KIND_OPTIONS.map((option) => {
                  const selected = draft.kind === option.kind;

                  return (
                    <button
                      key={option.kind}
                      type="button"
                      onClick={() => chooseKind(option.kind)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#0a583b] bg-[#eef6f0]"
                          : "border-[#dfe7e1] bg-white hover:border-[#8eb19d]"
                      }`}
                    >
                      <span className="block text-sm font-extrabold text-[#142019]">
                        {option.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#647168]">
                        {option.example}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 2. Applies to */}
            {draft.kind !== "free_delivery" && (
              <fieldset className="mt-7">
                <legend className="text-sm font-extrabold text-[#142019]">
                  2. Applies to
                </legend>

                <div className="mt-3 flex flex-wrap gap-2">
                  {SCOPE_OPTIONS.map((option) => (
                    <button
                      key={option.scope}
                      type="button"
                      onClick={() => update({ scope: option.scope })}
                      aria-pressed={draft.scope === option.scope}
                      className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                        draft.scope === option.scope
                          ? "bg-[#0a583b] text-white"
                          : "bg-[#f1f6f2] text-[#40614d] hover:bg-[#e3eee6]"
                      }`}
                    >
                      {option.title}
                    </button>
                  ))}
                </div>

                {draft.scope === "product" && (
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                      <select
                        aria-label="Filter products by brand"
                        value={productBrandFilter}
                        onChange={(event) =>
                          setProductBrandFilter(event.target.value)
                        }
                        className={FIELD}
                      >
                        <option value="all">All brands</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {displayName(brand)}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Product"
                        required
                        value={draft.productId}
                        onChange={(event) =>
                          update({
                            productId: event.target.value,
                            allSizes: true,
                            includeMainSize: false,
                            variantIds: [],
                          })
                        }
                        className={FIELD}
                      >
                        <option value="">Choose a product</option>
                        {/* Keep the saved product visible under any filter. */}
                        {selectedProduct &&
                          !productOptions.includes(selectedProduct) && (
                            <option value={selectedProduct.id}>
                              {displayName(selectedProduct)}
                            </option>
                          )}
                        {productOptions.map((product) => (
                          <option key={product.id} value={product.id}>
                            {displayName(product) || `#${product.id}`}
                            {productBrandFilter === "all" &&
                            brandName(product.brand_id)
                              ? ` — ${brandName(product.brand_id)}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct &&
                      isItemOffer &&
                      Number(selectedProduct.sale_percent || 0) > 0 && (
                        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-800">
                          This product has a sale price right now, so this
                          offer will not apply to it until the sale is removed.
                        </p>
                      )}

                    {/* Sizes (not for flash sales: a sale price covers the
                        whole product, like the product's own sale %). */}
                    {draft.productId && draft.kind !== "flash_sale" && (
                      <div className="rounded-2xl border border-[#dfe7e1] bg-[#fafcfb] p-4">
                        {sizesLoading ? (
                          <p className="text-sm text-[#647168]">
                            Loading sizes...
                          </p>
                        ) : productVariants.length === 0 ? (
                          <p className="text-sm text-[#647168]">
                            This product has one size. The offer applies to it.
                          </p>
                        ) : (
                          <>
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                type="checkbox"
                                checked={draft.allSizes}
                                onChange={(event) =>
                                  update({
                                    allSizes: event.target.checked,
                                    includeMainSize: false,
                                    variantIds: [],
                                  })
                                }
                                className="h-4 w-4 accent-[#0a583b]"
                              />
                              <span className="text-sm font-extrabold text-[#142019]">
                                All sizes of this product
                              </span>
                            </label>

                            {!draft.allSizes && (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {productIsAChoice && (
                                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e1e8e3] bg-white p-3">
                                    <input
                                      type="checkbox"
                                      checked={draft.includeMainSize}
                                      onChange={(event) =>
                                        update({
                                          includeMainSize: event.target.checked,
                                        })
                                      }
                                      className="h-4 w-4 accent-[#0a583b]"
                                    />
                                    <span className="text-sm font-bold text-[#142019]">
                                      {selectedProduct?.size_en ||
                                        selectedProduct?.size_ar ||
                                        "Main size"}
                                    </span>
                                  </label>
                                )}

                                {productVariants.map((variant) => (
                                  <label
                                    key={variant.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e1e8e3] bg-white p-3"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.variantIds.includes(
                                        variant.id
                                      )}
                                      onChange={() => toggleVariant(variant.id)}
                                      className="h-4 w-4 accent-[#0a583b]"
                                    />
                                    <span className="text-sm font-bold text-[#142019]">
                                      {variant.label_en ||
                                        variant.label_ar ||
                                        `Option ${variant.id}`}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {draft.scope === "category" && (
                  <select
                    aria-label="Category"
                    required
                    value={draft.categoryId}
                    onChange={(event) =>
                      update({ categoryId: event.target.value })
                    }
                    className={`${FIELD} mt-4`}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {displayName(category) || `#${category.id}`}
                        {brandName(category.brand_id)
                          ? ` — ${brandName(category.brand_id)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                )}

                {draft.scope === "brand" && (
                  <select
                    aria-label="Brand"
                    required
                    value={draft.brandId}
                    onChange={(event) =>
                      update({ brandId: event.target.value })
                    }
                    className={`${FIELD} mt-4`}
                  >
                    <option value="">Choose a brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {displayName(brand)}
                      </option>
                    ))}
                  </select>
                )}

                {isItemOffer && draft.scope !== "product" && (
                  <p className="mt-3 text-xs leading-5 text-[#647168]">
                    Each product and size is counted on its own: the customer
                    needs the quantity of one product in one size, not a mix.
                  </p>
                )}
              </fieldset>
            )}

            {/* 3. The offer */}
            <fieldset className="mt-7">
              <legend className="text-sm font-extrabold text-[#142019]">
                {draft.kind === "free_delivery" ? "2. The offer" : "3. The offer"}
              </legend>

              {draft.kind === "buy_x_get_y" && (
                <div className="mt-3 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#142019]">
                    <span>Buy</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      aria-label="Buy quantity"
                      value={draft.buyQuantity}
                      onChange={(event) =>
                        update({ buyQuantity: event.target.value })
                      }
                      className={NUMBER_FIELD}
                    />
                    <span>, get</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      aria-label="Get quantity"
                      value={draft.getQuantity}
                      onChange={(event) =>
                        update({ getQuantity: event.target.value })
                      }
                      className={NUMBER_FIELD}
                    />
                    <span>at</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step="0.01"
                      required
                      aria-label="Discount percent on the extra items"
                      value={draft.discountPercent}
                      onChange={(event) =>
                        update({ discountPercent: event.target.value })
                      }
                      className={NUMBER_FIELD}
                    />
                    <span>% off</span>

                    <span className="ms-1 flex gap-1.5">
                      {[
                        ["100", "Free"],
                        ["50", "Half price"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => update({ discountPercent: value })}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition ${
                            Number(draft.discountPercent) === Number(value)
                              ? "bg-[#0a583b] text-white"
                              : "bg-[#f1f6f2] text-[#40614d]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </span>
                  </div>

                  <p className="rounded-xl bg-[#f5f8f5] px-4 py-3 text-xs leading-5 text-[#526057]">
                    {Number(draft.discountPercent) >= 100
                      ? `Free items are added to the order automatically: the customer puts ${draft.buyQuantity || "X"} in the cart and receives ${draft.getQuantity || "Y"} more for free.`
                      : `The customer puts ${
                          (Number(draft.buyQuantity) || 0) +
                            (Number(draft.getQuantity) || 0) || "X + Y"
                        } in the cart, and ${draft.getQuantity || "Y"} of them get the discount.`}
                  </p>

                  <label className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#142019]">
                    <span>At most</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      aria-label="Times per order"
                      placeholder="∞"
                      value={draft.maxUsesPerOrder}
                      onChange={(event) =>
                        update({ maxUsesPerOrder: event.target.value })
                      }
                      className={NUMBER_FIELD}
                    />
                    <span>
                      times per product in one order
                      <span className="font-normal text-[#647168]">
                        {" "}
                        (empty = no limit)
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {draft.kind === "quantity_discount" && (
                <div className="mt-3 space-y-3">
                  {draft.tiers.map((tier, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#142019]"
                    >
                      <span>Buy</span>
                      <input
                        type="number"
                        min={2}
                        max={99}
                        required
                        aria-label={`Step ${index + 1} quantity`}
                        value={tier.minQuantity}
                        onChange={(event) =>
                          updateTier(index, {
                            minQuantity: event.target.value,
                          })
                        }
                        className={NUMBER_FIELD}
                      />
                      <span>or more, get</span>
                      <input
                        type="number"
                        min={1}
                        max={95}
                        step="0.01"
                        required
                        aria-label={`Step ${index + 1} discount percent`}
                        value={tier.percent}
                        onChange={(event) =>
                          updateTier(index, { percent: event.target.value })
                        }
                        className={NUMBER_FIELD}
                      />
                      <span>% off each</span>

                      {draft.tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            update({
                              tiers: draft.tiers.filter(
                                (_, position) => position !== index
                              ),
                            })
                          }
                          className="rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  {draft.tiers.length < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const last = draft.tiers[draft.tiers.length - 1];

                        update({
                          tiers: [
                            ...draft.tiers,
                            {
                              minQuantity: String(
                                (Number(last?.minQuantity) || 1) + 1
                              ),
                              percent: String(
                                Math.min(95, (Number(last?.percent) || 5) + 5)
                              ),
                            },
                          ],
                        });
                      }}
                      className="rounded-xl border border-[#d5dcd7] px-4 py-2.5 text-xs font-extrabold text-[#142019] hover:bg-[#f1f4f1]"
                    >
                      Add a bigger step
                    </button>
                  )}
                </div>
              )}

              {draft.kind === "flash_sale" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#142019]">
                  <input
                    type="number"
                    min={1}
                    max={95}
                    step="0.01"
                    required
                    aria-label="Flash sale discount percent"
                    value={draft.discountPercent}
                    onChange={(event) =>
                      update({ discountPercent: event.target.value })
                    }
                    className={NUMBER_FIELD}
                  />
                  <span>% off the price</span>
                  <p className="w-full text-xs font-normal leading-5 text-[#647168]">
                    Shown as a sale price with a countdown on the product page.
                    If a product already has a bigger sale, the bigger one
                    counts; they are never added together.
                  </p>
                </div>
              )}

              {draft.kind === "free_delivery" && (
                <label className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#142019]">
                  <span>Free delivery on orders of</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    aria-label="Minimum order for free delivery"
                    placeholder="0"
                    value={draft.minimumOrderAmount}
                    onChange={(event) =>
                      update({ minimumOrderAmount: event.target.value })
                    }
                    className="w-36 rounded-xl border border-[#d5dcd7] bg-white px-3 py-2.5 text-center text-sm font-extrabold text-[#142019] outline-none focus:border-[#0a583b]"
                  />
                  <span>
                    SYP or more
                    <span className="font-normal text-[#647168]">
                      {" "}
                      (empty = every order)
                    </span>
                  </span>
                </label>
              )}
            </fieldset>

            {/* 4. When */}
            <fieldset className="mt-7">
              <legend className="text-sm font-extrabold text-[#142019]">
                {draft.kind === "free_delivery" ? "3. When" : "4. When"}
              </legend>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-[#526057]">
                  Starts
                  <input
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(event) =>
                      update({ startsAt: event.target.value })
                    }
                    className={`${FIELD} mt-1.5`}
                  />
                  <span className="mt-1 block font-normal text-[#738078]">
                    Empty = right away.
                  </span>
                </label>

                <label className="text-xs font-bold text-[#526057]">
                  Ends
                  <input
                    type="datetime-local"
                    required={draft.kind === "flash_sale"}
                    value={draft.endsAt}
                    onChange={(event) => update({ endsAt: event.target.value })}
                    className={`${FIELD} mt-1.5`}
                  />
                  <span className="mt-1 block font-normal text-[#738078]">
                    {draft.kind === "flash_sale"
                      ? "Needed for a flash sale: the countdown runs to it."
                      : "Empty = until you pause or delete it."}
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Options */}
            <fieldset className="mt-7">
              <legend className="text-sm font-extrabold text-[#142019]">
                Options
              </legend>

              {isItemOffer && (
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e8e3] bg-[#fafcfb] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draft.allowWithCoupon}
                    onChange={(event) =>
                      update({ allowWithCoupon: event.target.checked })
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-[#0a583b]"
                  />
                  <span>
                    <span className="block text-sm font-extrabold text-[#142019]">
                      A coupon can be used on top of this offer
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#647168]">
                      Off (recommended): a coupon discounts only the items
                      that did not get this offer. On: the coupon also
                      discounts what is left of these items.
                    </span>
                  </span>
                </label>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-[#526057]">
                  Your own wording, English (optional)
                  <input
                    type="text"
                    maxLength={80}
                    value={draft.labelEn}
                    onChange={(event) => update({ labelEn: event.target.value })}
                    placeholder={
                      previewRule
                        ? promotionLabel(
                            { ...previewRule, labelEn: null },
                            "en"
                          )
                        : ""
                    }
                    className={`${FIELD} mt-1.5`}
                  />
                </label>

                <label className="text-xs font-bold text-[#526057]">
                  Your own wording, Arabic (optional)
                  <input
                    type="text"
                    dir="rtl"
                    maxLength={80}
                    value={draft.labelAr}
                    onChange={(event) => update({ labelAr: event.target.value })}
                    placeholder={
                      previewRule
                        ? promotionLabel(
                            { ...previewRule, labelAr: null },
                            "ar"
                          )
                        : ""
                    }
                    className={`${FIELD} mt-1.5`}
                  />
                </label>

                <label className="text-xs font-bold text-[#526057] sm:col-span-2">
                  Name for your own list (optional, customers never see it)
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.name}
                    onChange={(event) => update({ name: event.target.value })}
                    placeholder="e.g. Ramadan serum offer"
                    className={`${FIELD} mt-1.5`}
                  />
                </label>
              </div>
            </fieldset>

            {/* Preview */}
            <div className="mt-7 rounded-2xl border border-[#d8eadc] bg-[#f3faf4] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0a583b]">
                Customers will see
              </p>

              {previewRule ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-extrabold text-[#0a583b]">
                      {promotionLabel(previewRule, "en")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#40614d]">
                      {promotionDescription(previewRule, "en")}
                    </p>
                  </div>
                  <div dir="rtl">
                    <p className="text-sm font-extrabold text-[#0a583b]">
                      {promotionLabel(previewRule, "ar")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#40614d]">
                      {promotionDescription(previewRule, "ar")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-[#647168]">
                  Fill in the offer to see its wording.
                </p>
              )}
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              >
                {formError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl px-5 py-3 text-sm font-extrabold text-[#526057] hover:bg-[#f1f4f1]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || sizesLoading}
                className="rounded-xl bg-[#0a583b] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:bg-gray-400"
              >
                {saving
                  ? "Saving..."
                  : draft.id
                    ? "Save changes"
                    : "Create promotion"}
              </button>
            </div>
          </form>
        )}

        {/* List */}
        <section className="overflow-hidden rounded-[1.5rem] border border-[#e1e8e3] bg-white shadow-sm">
          <div className="border-b border-[#edf1ee] px-5 py-4 sm:px-6">
            <h2 className="font-extrabold text-[#142019]">Your promotions</h2>
          </div>

          {!loaded ? (
            <p className="p-6 text-sm text-[#647168]">Loading...</p>
          ) : promotions.length === 0 ? (
            <p className="p-6 text-sm text-[#647168]">
              No promotions yet. Create the first one with &quot;New
              promotion&quot;.
            </p>
          ) : (
            promotions.map(({ row, rule }) => {
              const busy = workingId === row.id;

              // A row the calculator cannot read never changes a price.
              if (!rule) {
                return (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1ee] p-5 last:border-0 sm:px-6"
                  >
                    <div>
                      <p className="font-extrabold text-[#142019]">
                        {String(row.name || "Promotion")}
                      </p>
                      <p className="mt-1 text-xs font-bold text-amber-700">
                        Incomplete: this promotion is not applied. Delete it
                        and create it again.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void remove(row.id, String(row.name || "Promotion"))
                      }
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-extrabold text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                );
              }

              const status = promotionStatus(rule, nowMs);
              const statusStyle = STATUS_STYLE[status];
              const label = promotionLabel(rule, "en");
              const showName =
                rule.name && rule.name !== label ? rule.name : "";

              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-[#edf1ee] p-5 last:border-0 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-[#142019]">{label}</p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyle.className}`}
                      >
                        {statusStyle.label}
                      </span>
                      {rule.allowWithCoupon && (
                        <span className="rounded-full bg-[#f1f6f2] px-2.5 py-1 text-xs font-bold text-[#40614d]">
                          + coupon allowed
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-bold text-[#0a583b]">
                      {targetText(rule)}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#647168]">
                      {showName ? `${showName} · ` : ""}
                      {rule.startsAt && status === "scheduled"
                        ? `Starts ${formatDate(rule.startsAt)}`
                        : ""}
                      {rule.startsAt && status === "scheduled" && rule.endsAt
                        ? " · "
                        : ""}
                      {rule.endsAt
                        ? `${status === "ended" ? "Ended" : "Ends"} ${formatDate(rule.endsAt)}`
                        : status === "scheduled"
                          ? ""
                          : "No end date"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openEdit(rule)}
                      className="rounded-xl border border-[#d5dcd7] px-3 py-2 text-xs font-extrabold text-[#142019] hover:bg-[#f1f4f1] disabled:opacity-50"
                    >
                      Edit
                    </button>

                    {status !== "ended" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void setActive(row.id, !rule.isActive)}
                        className={`rounded-xl border px-3 py-2 text-xs font-extrabold disabled:opacity-50 ${
                          rule.isActive
                            ? "border-[#d5dcd7] text-[#142019] hover:bg-[#f1f4f1]"
                            : "border-[#0a583b] bg-[#0a583b] text-white"
                        }`}
                      >
                        {rule.isActive ? "Pause" : "Resume"}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(row.id, label)}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
