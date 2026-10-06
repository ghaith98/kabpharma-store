import "server-only";

import {
  COD_FEE_SYP,
  MAX_ITEM_QUANTITY,
} from "@/lib/commerce-config";
import { hasMainSize } from "@/lib/product-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  priceCart,
  type CouponInput,
  type CouponType,
  type PricedLine,
  type PricingLineInput,
  type PricingResult,
} from "./engine";
import {
  clampPercent,
  normalizePromotionRow,
  type PromotionRule,
} from "./rules";

/*
  Builds a quote: reads the real products, promotions, coupon and delivery
  fee from the database and runs the price calculator on them.

  Used by:
    - POST /api/customer/quote        (cart, checkout and payment pages)
    - POST /api/customer/orders       (Sham Cash orders)
    - POST /api/customer/orders/cod   (cash on delivery orders)

  Nothing the browser sends is trusted except which products, which sizes
  and how many.
*/

type Row = Record<string, unknown>;

export type QuoteItemInput = {
  productId: number;
  variantId: number | null;
  quantity: number;
};

export type QuoteIssueReason =
  | "product_unavailable"
  | "option_invalid"
  | "option_unavailable"
  | "price_invalid";

export type QuoteIssue = {
  /** The line as the browser knows it: "<product>-<option or base>". */
  key: string;
  productId: number;
  variantId: number | null;
  reason: QuoteIssueReason;
};

export type CouponError =
  | "invalid"
  | "not_valid_now"
  | "already_used";

export type QuoteLine = PricedLine & {
  /** Keys the browser may have used for this line (see lineKey). */
  requestKeys: string[];
  productName: string;
  nameAr: string;
  nameEn: string;
  variantLabelAr: string | null;
  variantLabelEn: string | null;
  imageUrl: string | null;
};

/** One row for order_items, exactly as the order function expects it. */
export type QuoteOrderItem = {
  product_id: number;
  product_name: string;
  variant_id: number | null;
  variant_label_ar: string | null;
  variant_label_en: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
};

export type Quote = {
  pricedAtMs: number;
  lines: QuoteLine[];
  issues: QuoteIssue[];
  pricing: PricingResult;
  couponError: CouponError | null;
  couponOneUsePerCustomer: boolean;
  /** null when no area was asked for; false when it was not found. */
  deliveryAreaFound: boolean | null;
  deliveryAreaName: string | null;
  orderItems: QuoteOrderItem[];
};

export function lineKey(productId: number, variantId: number | null) {
  return `${productId}-${variantId ?? "base"}`;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isUnavailable(record: Row) {
  if (record.is_out_of_stock === true) return true;
  const stock = record.stock_quantity ?? record.stock;
  return stock != null && Number(stock) <= 0;
}

function variantLabel(variant: Row, language: "ar" | "en") {
  const candidates =
    language === "ar"
      ? [variant.label_ar, variant.name_ar, variant.label, variant.name, variant.label_en, variant.name_en]
      : [variant.label_en, variant.name_en, variant.label, variant.name, variant.label_ar, variant.name_ar];

  return (
    (candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    ) as string | undefined) || null
  );
}

export function cleanCouponCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

/** Every promotion that is switched on. Dates are checked by the calculator. */
export async function loadActivePromotions(): Promise<PromotionRule[]> {
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Promotions could not be loaded:", error);
    throw new Error("Promotions could not be loaded");
  }

  return ((data || []) as Row[])
    .map(normalizePromotionRow)
    .filter((rule): rule is PromotionRule => rule != null);
}

async function loadCoupon(
  rawCode: unknown,
  profileId: number | null,
  nowMs: number
): Promise<{
  coupon: CouponInput | null;
  error: CouponError | null;
  oneUsePerCustomer: boolean;
}> {
  const code = cleanCouponCode(rawCode);

  if (!code) {
    return { coupon: null, error: null, oneUsePerCustomer: false };
  }

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("Coupon lookup failed:", error);
    throw new Error("Coupon could not be checked");
  }

  if (!data || data.is_active !== true) {
    return { coupon: null, error: "invalid", oneUsePerCustomer: false };
  }

  const startsAt = data.starts_at
    ? new Date(data.starts_at).getTime()
    : null;
  const expiresAt = data.expires_at
    ? new Date(data.expires_at).getTime()
    : null;

  if (
    (startsAt != null && startsAt > nowMs) ||
    (expiresAt != null && expiresAt <= nowMs)
  ) {
    return {
      coupon: null,
      error: "not_valid_now",
      oneUsePerCustomer: false,
    };
  }

  const oneUsePerCustomer = data.one_use_per_customer === true;

  if (oneUsePerCustomer && profileId) {
    const { data: priorUse, error: usageError } = await supabaseAdmin
      .from("coupon_usages")
      .select("id")
      .eq("coupon_id", data.id)
      .eq("profile_id", profileId)
      .limit(1);

    if (usageError) {
      console.error("Coupon usage lookup failed:", usageError);
      throw new Error("Coupon could not be checked");
    }

    if (priorUse && priorUse.length > 0) {
      return {
        coupon: null,
        error: "already_used",
        oneUsePerCustomer,
      };
    }
  }

  const rawType = String(data.discount_type || "percent");
  const type: CouponType =
    rawType === "fixed" || rawType === "free_delivery"
      ? rawType
      : "percent";

  const percent = clampPercent(data.discount_percent);
  const amount = Math.max(0, Number(data.discount_amount) || 0);

  // A coupon that cannot give anything is treated as invalid.
  if (
    (type === "percent" && percent <= 0) ||
    (type === "fixed" && amount <= 0)
  ) {
    return { coupon: null, error: "invalid", oneUsePerCustomer };
  }

  return {
    coupon: {
      id: Number(data.id),
      code,
      type,
      percent,
      amount,
      maximumDiscount: Math.max(0, Number(data.maximum_discount) || 0),
      minimumOrderAmount: Math.max(
        0,
        Number(data.minimum_order_amount) || 0
      ),
      // Coupons made before this switch existed applied to sale items.
      appliesToSaleItems: data.applies_to_sale_items !== false,
    },
    error: null,
    oneUsePerCustomer,
  };
}

export async function buildQuote(options: {
  items: QuoteItemInput[];
  couponCode?: unknown;
  profileId?: number | null;
  governorate?: string | null;
  deliveryAreaName?: string | null;
  paymentMethod?: "cod" | "transfer" | null;
  /** The moment to price at: now, or a held price's moment. */
  nowMs: number;
}): Promise<Quote> {
  const nowMs = options.nowMs;

  const items = options.items.filter(
    (item) =>
      Number.isInteger(item.productId) &&
      item.productId > 0 &&
      (item.variantId === null ||
        (Number.isInteger(item.variantId) && item.variantId > 0)) &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );

  const productIds = [...new Set(items.map((item) => item.productId))];
  const governorate = cleanText(options.governorate, 100);
  const requestedArea = cleanText(options.deliveryAreaName, 150);
  const wantsDelivery = Boolean(governorate && requestedArea);

  const [
    productsResult,
    variantsResult,
    promotions,
    couponResult,
    thresholdResult,
    areaResult,
  ] = await Promise.all([
    productIds.length
      ? supabaseAdmin
          .from("products")
          .select(
            "id, name, name_ar, name_en, price, sale_percent, size_ar, size_en, image_url, is_out_of_stock, category_id, brand_id"
          )
          .in("id", productIds)
      : Promise.resolve({ data: [] as Row[], error: null }),

    productIds.length
      ? supabaseAdmin
          .from("product_variants")
          .select("*")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] as Row[], error: null }),

    loadActivePromotions(),

    loadCoupon(options.couponCode, options.profileId ?? null, nowMs),

    supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "free_shipping_threshold")
      .maybeSingle(),

    wantsDelivery
      ? supabaseAdmin
          .from("delivery_areas")
          .select(
            "id, governorate, area_name, area_name_ar, area_name_en, delivery_fee, is_active"
          )
          .eq("governorate", governorate)
          .eq("is_active", true)
      : Promise.resolve({ data: [] as Row[], error: null }),
  ]);

  if (productsResult.error || variantsResult.error || areaResult.error) {
    console.error("Quote lookup failed:", {
      products: productsResult.error,
      variants: variantsResult.error,
      deliveryArea: areaResult.error,
    });
    throw new Error("Quote lookup failed");
  }

  const products = new Map(
    ((productsResult.data || []) as Row[]).map((product) => [
      Number(product.id),
      product,
    ])
  );

  const variantsByProduct = new Map<number, Row[]>();

  for (const variant of (variantsResult.data || []) as Row[]) {
    const productId = Number(variant.product_id);
    const list = variantsByProduct.get(productId) || [];
    list.push(variant);
    variantsByProduct.set(productId, list);
  }

  type Resolved = {
    input: PricingLineInput;
    requestKeys: string[];
    product: Row;
    variant: Row | null;
  };

  const resolved = new Map<string, Resolved>();
  const issues: QuoteIssue[] = [];

  for (const item of items) {
    const requestKey = lineKey(item.productId, item.variantId);

    const issue = (reason: QuoteIssueReason) =>
      issues.push({
        key: requestKey,
        productId: item.productId,
        variantId: item.variantId,
        reason,
      });

    const product = products.get(item.productId);

    if (!product || isUnavailable(product)) {
      issue("product_unavailable");
      continue;
    }

    const productVariants = variantsByProduct.get(item.productId) || [];
    let variant: Row | null = null;

    if (item.variantId !== null) {
      variant =
        productVariants.find(
          (candidate) => Number(candidate.id) === item.variantId
        ) || null;

      if (!variant) {
        issue("option_invalid");
        continue;
      }
    } else if (productVariants.length > 0 && !hasMainSize(product)) {
      // No option chosen and no main size: the cheapest option (older
      // products). With a main size, "no option" means the main size.
      variant =
        [...productVariants]
          .filter((candidate) => !isUnavailable(candidate))
          .sort(
            (first, second) =>
              Number(first.price || 0) - Number(second.price || 0)
          )[0] || null;

      if (!variant) {
        issue("option_unavailable");
        continue;
      }
    }

    if (variant && isUnavailable(variant)) {
      issue("option_unavailable");
      continue;
    }

    const basePrice = Number(variant?.price ?? product.price ?? 0);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      issue("price_invalid");
      continue;
    }

    const variantId = variant?.id != null ? Number(variant.id) : null;
    const key = lineKey(item.productId, variantId);
    const existing = resolved.get(key);

    // The same product and size sent twice counts as one line.
    if (existing) {
      existing.input.quantity += item.quantity;
      if (!existing.requestKeys.includes(requestKey)) {
        existing.requestKeys.push(requestKey);
      }
      continue;
    }

    resolved.set(key, {
      input: {
        key,
        productId: item.productId,
        variantId,
        categoryId:
          product.category_id == null ? null : Number(product.category_id),
        brandId: product.brand_id == null ? null : Number(product.brand_id),
        quantity: item.quantity,
        basePrice,
        regularSalePercent: clampPercent(product.sale_percent),
      },
      requestKeys: [requestKey],
      product,
      variant,
    });
  }

  for (const entry of resolved.values()) {
    entry.input.quantity = Math.min(
      entry.input.quantity,
      MAX_ITEM_QUANTITY
    );
  }

  const deliveryArea = wantsDelivery
    ? ((areaResult.data || []) as Row[]).find(
        (area) => area.area_name === requestedArea
      ) || null
    : null;

  const pricing = priceCart({
    lines: [...resolved.values()].map((entry) => entry.input),
    promotions,
    coupon: couponResult.coupon,
    delivery: {
      fee: deliveryArea ? Number(deliveryArea.delivery_fee || 0) : null,
      freeShippingThreshold: Number(thresholdResult.data?.value || 0),
    },
    codFee: options.paymentMethod === "cod" ? COD_FEE_SYP : 0,
    nowMs,
  });

  const lines: QuoteLine[] = [];
  const orderItems: QuoteOrderItem[] = [];

  for (const priced of pricing.lines) {
    const entry = resolved.get(priced.key);
    if (!entry) continue;

    const { product, variant } = entry;

    // Priced, but worth nothing: never sell an item for 0.
    if (priced.unitPrice <= 0) {
      for (const requestKey of entry.requestKeys) {
        issues.push({
          key: requestKey,
          productId: priced.productId,
          variantId: priced.variantId,
          reason: "price_invalid",
        });
      }
    }

    const productName =
      cleanText(product.name || product.name_en || product.name_ar, 200) ||
      "KAB Pharma product";

    const variantLabelAr = variant
      ? variantLabel(variant, "ar")
      : cleanText(product.size_ar || product.size_en, 80) || null;

    const variantLabelEn = variant
      ? variantLabel(variant, "en")
      : cleanText(product.size_en || product.size_ar, 80) || null;

    const imageUrl =
      (typeof variant?.image_url === "string" && variant.image_url) ||
      (typeof product.image_url === "string" && product.image_url) ||
      null;

    lines.push({
      ...priced,
      requestKeys: entry.requestKeys,
      productName,
      nameAr: cleanText(product.name_ar || product.name || product.name_en, 200),
      nameEn: cleanText(product.name_en || product.name || product.name_ar, 200),
      variantLabelAr,
      variantLabelEn,
      imageUrl,
    });

    orderItems.push({
      product_id: priced.productId,
      product_name: productName,
      variant_id: priced.variantId,
      variant_label_ar: variantLabelAr,
      variant_label_en: variantLabelEn,
      image_url: imageUrl,
      // Free items are stored as ordinary items of the same line.
      quantity: priced.quantity + priced.freeQuantity,
      unit_price: priced.unitPrice,
    });
  }

  return {
    pricedAtMs: nowMs,
    lines,
    issues,
    pricing,
    couponError: couponResult.error,
    couponOneUsePerCustomer: couponResult.oneUsePerCustomer,
    deliveryAreaFound: wantsDelivery ? deliveryArea != null : null,
    deliveryAreaName: deliveryArea
      ? String(deliveryArea.area_name)
      : null,
    orderItems,
  };
}
