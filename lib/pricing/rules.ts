/*
  Promotion rules: the shape of one promotion, how a database row becomes
  one, which products it covers, and the words customers see for it.

  This file is pure (no database, no browser APIs), so the server price
  calculator, the storefront badges and the admin page all share it and can
  never disagree about what a promotion means.

  Promotion kinds
  ---------------
  buy_x_get_y        Buy X, get Y at P% off. P = 100 means "free": the free
                     items are added to the order automatically. Below 100
                     the customer puts all X + Y items in the cart.
                     Always counted per product and size, never mixed.
  quantity_discount  Buy at least N of one product and size, get P% off each.
                     Several steps are allowed (2+ = 10%, 3+ = 15%).
  flash_sale         A sale price (P% off) between two dates.
  free_delivery      Delivery is free between two dates, optionally only
                     above a minimum order.
*/

export type PromotionKind =
  | "buy_x_get_y"
  | "quantity_discount"
  | "flash_sale"
  | "free_delivery";

export type PromotionScope = "product" | "category" | "brand" | "all";

export type PromotionTier = {
  minQuantity: number;
  percent: number;
};

export type PromotionRule = {
  id: string;
  /** Admin-only name. */
  name: string;
  kind: PromotionKind;
  scope: PromotionScope;

  productId: number | null;
  categoryId: number | null;
  brandId: number | null;

  /** Product scope only: every size, or just the chosen ones. */
  allSizes: boolean;
  includeMainSize: boolean;
  variantIds: number[];

  buyQuantity: number;
  getQuantity: number;
  /** buy_x_get_y: discount on the "get" items. flash_sale: the sale. */
  discountPercent: number;
  tiers: PromotionTier[];

  minimumOrderAmount: number;
  maxUsesPerOrder: number | null;
  allowWithCoupon: boolean;

  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;

  labelAr: string | null;
  labelEn: string | null;
  createdAt: string | null;
};

export type PromotionTarget = {
  productId: number;
  /** null = the product itself / its main size. */
  variantId: number | null;
  categoryId: number | null;
  brandId: number | null;
};

type Row = Record<string, unknown>;

function toInt(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function toId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function toText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}

export function clampPercent(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
}

/** Reads the stored steps, drops bad ones, sorts them by quantity. */
export function normalizeTiers(value: unknown): PromotionTier[] {
  let list: unknown = value;

  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) return [];

  const byQuantity = new Map<number, number>();

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Row;
    const minQuantity = toInt(record.min_quantity ?? record.minQuantity);
    const percent = clampPercent(record.percent);

    if (minQuantity < 1 || minQuantity > 99 || percent <= 0) continue;

    // Two steps on the same quantity: the better one counts.
    byQuantity.set(
      minQuantity,
      Math.max(percent, byQuantity.get(minQuantity) || 0)
    );
  }

  return [...byQuantity.entries()]
    .map(([minQuantity, percent]) => ({ minQuantity, percent }))
    .sort((first, second) => first.minQuantity - second.minQuantity);
}

/**
 * Turns a `promotions` table row into a rule. Returns null when the row is
 * incomplete, so a half-filled promotion can never change a price.
 */
export function normalizePromotionRow(
  row: Row | null | undefined
): PromotionRule | null {
  if (!row) return null;

  const id = String(row.id || "");
  if (!id) return null;

  const type = String(row.type || "");

  // The two original offer types are "buy X get Y" with fixed numbers.
  const legacy =
    type === "buy_2_get_1"
      ? { buy: 2, get: 1, percent: 100 }
      : type === "buy_1_second_50"
        ? { buy: 1, get: 1, percent: 50 }
        : null;

  const kind: PromotionKind | null = legacy
    ? "buy_x_get_y"
    : type === "buy_x_get_y" ||
        type === "quantity_discount" ||
        type === "flash_sale" ||
        type === "free_delivery"
      ? type
      : null;

  if (!kind) return null;

  const rawScope = String(row.scope || "product");
  let scope: PromotionScope =
    rawScope === "category" ||
    rawScope === "brand" ||
    rawScope === "all"
      ? rawScope
      : "product";

  // Free delivery is about the whole order, not about products.
  if (kind === "free_delivery") scope = "all";

  // Rows saved before the new columns existed keep their target in the old
  // product_id / variant_id columns.
  const legacyOnly = row.target_product_id == null && row.product_id != null;

  const productId = toId(row.target_product_id) ?? toId(row.product_id);
  const categoryId = toId(row.category_id);
  const brandId = toId(row.brand_id);

  if (scope === "product" && !productId) return null;
  if (scope === "category" && !categoryId) return null;
  if (scope === "brand" && !brandId) return null;

  const legacyVariantId = toId(row.variant_id);

  const variantIds = legacyOnly
    ? legacyVariantId
      ? [legacyVariantId]
      : []
    : (Array.isArray(row.variant_ids) ? row.variant_ids : [])
        .map(toId)
        .filter((value): value is number => value != null);

  const allSizes = legacyOnly ? false : row.all_sizes !== false;
  const includeMainSize = legacyOnly
    ? !legacyVariantId
    : row.include_main_size === true;

  const buyQuantity = toInt(row.buy_quantity) || legacy?.buy || 0;
  const getQuantity = toInt(row.get_quantity) || legacy?.get || 0;
  const discountPercent = clampPercent(
    row.discount_percent ?? legacy?.percent ?? 0
  );
  const tiers = normalizeTiers(row.tiers);

  if (kind === "buy_x_get_y") {
    if (buyQuantity < 1 || getQuantity < 1 || discountPercent <= 0) {
      return null;
    }
  }

  if (kind === "quantity_discount" && tiers.length === 0) return null;
  if (kind === "flash_sale" && discountPercent <= 0) return null;

  const maxUses = toInt(row.max_uses_per_order);

  return {
    id,
    name: String(row.name || ""),
    kind,
    scope,
    productId: scope === "product" ? productId : null,
    categoryId: scope === "category" ? categoryId : null,
    brandId: scope === "brand" ? brandId : null,
    allSizes,
    includeMainSize,
    variantIds,
    buyQuantity,
    getQuantity,
    discountPercent,
    tiers,
    minimumOrderAmount: Math.max(0, Number(row.minimum_order_amount) || 0),
    maxUsesPerOrder: maxUses > 0 ? maxUses : null,
    allowWithCoupon: row.allow_with_coupon === true,
    startsAt: toText(row.starts_at),
    endsAt: toText(row.ends_at),
    isActive: row.is_active !== false,
    labelAr: toText(row.label_ar),
    labelEn: toText(row.label_en),
    createdAt: toText(row.created_at),
  };
}

function toTime(value: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export type PromotionStatus = "paused" | "scheduled" | "active" | "ended";

export function promotionStatus(
  rule: Pick<PromotionRule, "isActive" | "startsAt" | "endsAt">,
  nowMs: number
): PromotionStatus {
  const startsAt = toTime(rule.startsAt);
  const endsAt = toTime(rule.endsAt);

  if (endsAt != null && endsAt <= nowMs) return "ended";
  if (!rule.isActive) return "paused";
  if (startsAt != null && startsAt > nowMs) return "scheduled";

  return "active";
}

/** Switched on and inside its dates at this moment. */
export function isPromotionLive(rule: PromotionRule, nowMs: number) {
  return promotionStatus(rule, nowMs) === "active";
}

/** Does this promotion cover this product and size? */
export function promotionCovers(
  rule: PromotionRule,
  target: PromotionTarget
) {
  if (rule.kind === "free_delivery") return false;

  if (rule.scope === "all") return true;

  if (rule.scope === "brand") {
    return rule.brandId != null && rule.brandId === target.brandId;
  }

  if (rule.scope === "category") {
    return (
      rule.categoryId != null && rule.categoryId === target.categoryId
    );
  }

  if (rule.productId == null || rule.productId !== target.productId) {
    return false;
  }

  if (rule.allSizes) return true;

  return target.variantId == null
    ? rule.includeMainSize
    : rule.variantIds.includes(target.variantId);
}

/** Does this promotion cover at least one size of this product? */
export function promotionCoversProduct(
  rule: PromotionRule,
  product: Omit<PromotionTarget, "variantId">
) {
  if (rule.kind === "free_delivery") return false;
  if (rule.scope !== "product") {
    return promotionCovers(rule, { ...product, variantId: null });
  }

  return rule.productId != null && rule.productId === product.productId;
}

/** Narrower offers win a tie: a size beats a product beats a brand. */
export function promotionSpecificity(rule: PromotionRule) {
  if (rule.scope === "product") return rule.allSizes ? 3 : 4;
  if (rule.scope === "category") return 2;
  if (rule.scope === "brand") return 1;
  return 0;
}

function trimPercent(value: number) {
  return String(Math.round(value * 100) / 100);
}

export type Language = "ar" | "en";

/** Short line for badges, the cart and invoices. */
export function promotionLabel(rule: PromotionRule, language: Language) {
  const custom = language === "ar" ? rule.labelAr : rule.labelEn;
  if (custom) return custom;

  const arabic = language === "ar";
  const percent = trimPercent(rule.discountPercent);

  if (rule.kind === "buy_x_get_y") {
    const buy = rule.buyQuantity;
    const get = rule.getQuantity;

    if (rule.discountPercent >= 100) {
      return arabic
        ? `اشتري ${buy} واحصلي على ${get} مجاناً`
        : `Buy ${buy}, get ${get} free`;
    }

    if (buy === 1 && get === 1 && rule.discountPercent === 50) {
      return arabic
        ? "اشتري 1، والثاني بنصف السعر"
        : "Buy 1, get the 2nd half price";
    }

    return arabic
      ? `اشتري ${buy} واحصلي على ${get} بخصم ${percent}%`
      : `Buy ${buy}, get ${get} at ${percent}% off`;
  }

  if (rule.kind === "quantity_discount") {
    const first = rule.tiers[0];
    const best = rule.tiers[rule.tiers.length - 1];

    if (!first || !best) return "";

    if (rule.tiers.length === 1) {
      return arabic
        ? `اشتري ${first.minQuantity} أو أكثر ووفّري ${trimPercent(first.percent)}%`
        : `Buy ${first.minQuantity}+, save ${trimPercent(first.percent)}%`;
    }

    return arabic
      ? `اشتري أكثر ووفّري حتى ${trimPercent(best.percent)}%`
      : `Buy more, save up to ${trimPercent(best.percent)}%`;
  }

  if (rule.kind === "flash_sale") {
    return arabic ? `عرض لفترة محدودة −${percent}%` : `Flash sale −${percent}%`;
  }

  return arabic ? "توصيل مجاني" : "Free delivery";
}

/** One or two sentences for the product page. */
export function promotionDescription(
  rule: PromotionRule,
  language: Language
) {
  const arabic = language === "ar";
  const percent = trimPercent(rule.discountPercent);

  if (rule.kind === "buy_x_get_y") {
    const buy = rule.buyQuantity;
    const get = rule.getQuantity;

    if (rule.discountPercent >= 100) {
      return arabic
        ? `أضيفي ${buy} من هذا الحجم إلى السلة، ونضيف ${get} مجاناً إلى طلبكِ تلقائياً.`
        : `Add ${buy} of this size to your cart and ${get} more ${get === 1 ? "is" : "are"} added to your order free.`;
    }

    return arabic
      ? `أضيفي ${buy + get} من هذا الحجم إلى السلة لتحصلي على خصم ${percent}% على ${get} منها.`
      : `Add ${buy + get} of this size to your cart and ${get} of them ${get === 1 ? "is" : "are"} ${percent}% off.`;
  }

  if (rule.kind === "quantity_discount") {
    return rule.tiers
      .map((tier) =>
        arabic
          ? `${tier.minQuantity} أو أكثر: خصم ${trimPercent(tier.percent)}% على كل قطعة`
          : `${tier.minQuantity} or more: ${trimPercent(tier.percent)}% off each`
      )
      .join(arabic ? " · " : " · ");
  }

  if (rule.kind === "flash_sale") {
    return arabic
      ? `خصم ${percent}% لفترة محدودة.`
      : `${percent}% off for a limited time.`;
  }

  if (rule.minimumOrderAmount > 0) {
    const amount = Math.round(rule.minimumOrderAmount).toLocaleString("en-US");

    return arabic
      ? `توصيل مجاني للطلبات بقيمة ${amount} ل.س أو أكثر.`
      : `Free delivery on orders of ${amount} SYP or more.`;
  }

  return arabic ? "توصيل مجاني على جميع الطلبات." : "Free delivery on every order.";
}

/**
 * What the public "active promotions" endpoint sends to the browser:
 * only what badges and prices need, nothing internal.
 */
export type PublicPromotion = Pick<
  PromotionRule,
  | "id"
  | "kind"
  | "scope"
  | "productId"
  | "categoryId"
  | "brandId"
  | "allSizes"
  | "includeMainSize"
  | "variantIds"
  | "buyQuantity"
  | "getQuantity"
  | "discountPercent"
  | "tiers"
  | "minimumOrderAmount"
  | "startsAt"
  | "endsAt"
  | "labelAr"
  | "labelEn"
>;

export function toPublicPromotion(rule: PromotionRule): PublicPromotion {
  return {
    id: rule.id,
    kind: rule.kind,
    scope: rule.scope,
    productId: rule.productId,
    categoryId: rule.categoryId,
    brandId: rule.brandId,
    allSizes: rule.allSizes,
    includeMainSize: rule.includeMainSize,
    variantIds: rule.variantIds,
    buyQuantity: rule.buyQuantity,
    getQuantity: rule.getQuantity,
    discountPercent: rule.discountPercent,
    tiers: rule.tiers,
    minimumOrderAmount: rule.minimumOrderAmount,
    startsAt: rule.startsAt,
    endsAt: rule.endsAt,
    labelAr: rule.labelAr,
    labelEn: rule.labelEn,
  };
}

/** A public promotion with the internal fields filled with safe defaults. */
export function fromPublicPromotion(
  promotion: PublicPromotion
): PromotionRule {
  return {
    ...promotion,
    name: "",
    maxUsesPerOrder: null,
    allowWithCoupon: false,
    isActive: true,
    createdAt: null,
  };
}
