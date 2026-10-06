/*
  The price calculator.

  One function, `priceCart`, turns "these items, these promotions, this
  coupon, this delivery fee" into every number the store shows or charges:
  line prices, discounts, free items, delivery and the total.

  The cart, checkout and payment pages show its result, and both order
  routes charge its result, so what the customer sees is what they pay.

  Pure: no database, no clock (the time is passed in), no browser APIs.
  All amounts are whole SYP.

  The rules, in order
  -------------------
  1. Sale price. An item's price is its base price minus the bigger of the
     product's own sale % and any live flash sale that covers it.
  2. Item promotions (buy X get Y, quantity discount). Counted per product
     and size. Items that are on sale are skipped. An item gets at most one
     promotion: the one that saves the customer the most.
  3. Coupon. Discounts only the items that did not get a promotion (unless
     that promotion allows coupons), and skips sale items unless the coupon
     allows them.
  4. Delivery. Free when the store's free-delivery amount is reached, or a
     free-delivery promotion or coupon applies.
*/

import {
  clampPercent,
  isPromotionLive,
  promotionCovers,
  promotionLabel,
  promotionSpecificity,
  type PromotionRule,
} from "./rules";

export type PricingLineInput = {
  /** Stable id of the line, e.g. "24-base" or "24-91". */
  key: string;
  productId: number;
  /** null = the product itself / its main size. */
  variantId: number | null;
  categoryId: number | null;
  brandId: number | null;
  quantity: number;
  /** Unit price before any sale. */
  basePrice: number;
  /** The product's own sale %, 0 when not on sale. */
  regularSalePercent: number;
};

export type CouponType = "percent" | "fixed" | "free_delivery";

export type CouponInput = {
  id: number;
  code: string;
  type: CouponType;
  percent: number;
  amount: number;
  /** 0 = no cap. Percentage coupons only. */
  maximumDiscount: number;
  minimumOrderAmount: number;
  appliesToSaleItems: boolean;
};

export type PricingInput = {
  lines: PricingLineInput[];
  promotions: PromotionRule[];
  coupon: CouponInput | null;
  delivery: {
    /** The area's fee, or null when no area is chosen yet. */
    fee: number | null;
    /** Store setting. 0 = no automatic free delivery. */
    freeShippingThreshold: number;
  };
  codFee: number;
  nowMs: number;
};

export type Bilingual = { ar: string; en: string };

export type PricedLinePromotion = {
  id: string;
  kind: "buy_x_get_y" | "quantity_discount";
  label: Bilingual;
  allowWithCoupon: boolean;
};

export type PricedLine = {
  key: string;
  productId: number;
  variantId: number | null;

  /** What the customer put in the cart (and pays for). */
  quantity: number;
  /** Extra items added free by a promotion. */
  freeQuantity: number;

  baseUnitPrice: number;
  unitPrice: number;
  salePercent: number;
  onSale: boolean;
  flashSale: { promotionId: string; endsAt: string | null } | null;

  /** unitPrice x quantity. */
  subtotal: number;
  /** Taken off this line by its promotion (free items not included). */
  promotionDiscount: number;
  /** subtotal - promotionDiscount: what this line costs. */
  total: number;

  /** The promotion that changed this line, if any. */
  promotion: PricedLinePromotion | null;
  /** "Add 1 more to get..." when an offer is within reach. */
  hint: Bilingual | null;
};

export type AppliedPromotion = {
  promotionId: string;
  promotionName: string;
  labelAr: string;
  labelEn: string;
  kind: "free_items" | "line_discount";
  /** Older order pages read this field; kept for them. */
  type: "buy_2_get_1" | "buy_1_second_50";
  productId: number;
  variantId: number | null;
  /** free_items: free item count. line_discount: discounted item count. */
  affectedQuantity: number;
  /** Value of the free items, or the money taken off the line. */
  discountAmount: number;
};

export type CouponOutcome = {
  id: number;
  code: string;
  type: CouponType;
  applied: boolean;
  /** Why it was not applied. */
  reason:
    | null
    | "minimum_not_met"
    | "no_eligible_items"
    | "delivery_already_free";
  discountAmount: number;
  freeDelivery: boolean;
  minimumOrderAmount: number;
};

export type FreeDeliveryReason = "threshold" | "promotion" | "coupon";

export type PricingResult = {
  lines: PricedLine[];
  promotions: AppliedPromotion[];
  coupon: CouponOutcome | null;

  delivery: {
    /** null while no delivery area is chosen. */
    fee: number | null;
    configuredFee: number | null;
    free: boolean;
    freeReason: FreeDeliveryReason | null;
    freePromotionId: string | null;
    /**
     * Spend this much on products for free delivery (lowest rule that is
     * live now). null = no such rule. 0 = free on every order.
     */
    freeFrom: number | null;
  };

  totals: {
    itemsCount: number;
    freeItemsCount: number;
    /** Saved by sale prices, before promotions. */
    saleSavings: number;
    /** Sum of the lines at their current unit prices. */
    subtotal: number;
    promotionDiscount: number;
    freeItemsValue: number;
    couponDiscount: number;
    /** What the products cost after promotions and coupon. */
    goodsTotal: number;
    deliveryFee: number;
    codFee: number;
    total: number;
  };

  /**
   * The same order written the way it is stored: free items are counted
   * as ordinary items and their value as a discount. The total is equal.
   */
  order: {
    productsSubtotal: number;
    discountAmount: number;
    promotionDiscountAmount: number;
    total: number;
  };
};

function money(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

/** Same rounding the store has always used for a sale price. */
export function applyPercent(price: number, percent: number) {
  return money(price * (1 - clampPercent(percent) / 100));
}

function percentOf(price: number, percent: number) {
  return money(price * (clampPercent(percent) / 100));
}

function trimPercent(value: number) {
  return String(Math.round(value * 100) / 100);
}

type Evaluation = {
  rule: PromotionRule;
  freeQuantity: number;
  discount: number;
  discountedQuantity: number;
  hint: Bilingual | null;
};

function evaluateBuyXGetY(
  rule: PromotionRule,
  quantity: number,
  unitPrice: number
): Evaluation {
  const buy = rule.buyQuantity;
  const get = rule.getQuantity;
  const cap = rule.maxUsesPerOrder ?? Number.MAX_SAFE_INTEGER;
  const free = rule.discountPercent >= 100;

  // Free items are added on top of what is in the cart, so only the "buy"
  // items have to be there. Discounted items are paid for, so all of them do.
  const groupSize = free ? buy : buy + get;
  const possible = Math.floor(quantity / groupSize);
  const uses = Math.min(possible, cap);

  // "Add 1 more": only while the offer can still be used again and the
  // customer has started, but not finished, the next group.
  const leftover = quantity % groupSize;
  const missing = groupSize - leftover;

  const hint: Bilingual | null =
    possible < cap && leftover > 0
      ? free
        ? {
            ar: `أضيفي ${missing} لتحصلي على ${get} مجاناً`,
            en: `Add ${missing} more to get ${get} free`,
          }
        : {
            ar: `أضيفي ${missing} لتحصلي على خصم ${trimPercent(rule.discountPercent)}% على ${get}`,
            en: `Add ${missing} more to get ${get} at ${trimPercent(rule.discountPercent)}% off`,
          }
      : null;

  if (free) {
    return {
      rule,
      freeQuantity: uses * get,
      discount: 0,
      discountedQuantity: 0,
      hint,
    };
  }

  const discountedQuantity = uses * get;

  return {
    rule,
    freeQuantity: 0,
    discount: discountedQuantity * percentOf(unitPrice, rule.discountPercent),
    discountedQuantity,
    hint,
  };
}

function evaluateQuantityDiscount(
  rule: PromotionRule,
  quantity: number,
  unitPrice: number
): Evaluation {
  let reached: PromotionRule["tiers"][number] | null = null;
  let next: PromotionRule["tiers"][number] | null = null;

  for (const tier of rule.tiers) {
    if (quantity >= tier.minQuantity) {
      reached = tier;
    } else if (!next) {
      next = tier;
    }
  }

  const hint: Bilingual | null = next
    ? {
        ar: `أضيفي ${next.minQuantity - quantity} لتحصلي على خصم ${trimPercent(next.percent)}% على كل قطعة`,
        en: `Add ${next.minQuantity - quantity} more to save ${trimPercent(next.percent)}% on each`,
      }
    : null;

  return {
    rule,
    freeQuantity: 0,
    discount: reached
      ? quantity * percentOf(unitPrice, reached.percent)
      : 0,
    discountedQuantity: reached ? quantity : 0,
    hint,
  };
}

export function priceCart(input: PricingInput): PricingResult {
  const livePromotions = input.promotions.filter((rule) =>
    isPromotionLive(rule, input.nowMs)
  );

  const flashSales = livePromotions.filter(
    (rule) => rule.kind === "flash_sale"
  );

  // Sorted so the result never depends on the order the database happens
  // to return the promotions in.
  const itemPromotions = livePromotions
    .filter(
      (rule) =>
        rule.kind === "buy_x_get_y" || rule.kind === "quantity_discount"
    )
    .sort((first, second) => (first.id < second.id ? -1 : 1));

  const freeDeliveryPromotions = livePromotions.filter(
    (rule) => rule.kind === "free_delivery"
  );

  const lines: PricedLine[] = [];
  const applied: AppliedPromotion[] = [];

  for (const line of input.lines) {
    const quantity = Math.max(0, Math.trunc(Number(line.quantity) || 0));
    if (quantity === 0) continue;

    const target = {
      productId: line.productId,
      variantId: line.variantId,
      categoryId: line.categoryId,
      brandId: line.brandId,
    };

    // 1. Sale price: the bigger of the product's sale and a flash sale.
    const baseUnitPrice = money(line.basePrice);
    const regularPercent = clampPercent(line.regularSalePercent);

    let flash: PromotionRule | null = null;

    for (const rule of flashSales) {
      if (!promotionCovers(rule, target)) continue;

      if (!flash || rule.discountPercent > flash.discountPercent) {
        flash = rule;
      }
    }

    const flashWins =
      flash != null && flash.discountPercent > regularPercent;

    const salePercent = flashWins
      ? (flash as PromotionRule).discountPercent
      : regularPercent;

    const unitPrice = applyPercent(baseUnitPrice, salePercent);
    const onSale = salePercent > 0;
    const subtotal = unitPrice * quantity;

    // 2. Item promotion: best one for the customer, never on sale items.
    let best: Evaluation | null = null;
    let bestValue = 0;
    let hintFrom: Evaluation | null = null;

    if (!onSale && unitPrice > 0) {
      for (const rule of itemPromotions) {
        if (!promotionCovers(rule, target)) continue;

        const evaluation =
          rule.kind === "buy_x_get_y"
            ? evaluateBuyXGetY(rule, quantity, unitPrice)
            : evaluateQuantityDiscount(rule, quantity, unitPrice);

        const value =
          evaluation.discount + evaluation.freeQuantity * unitPrice;

        const better =
          value > bestValue ||
          (value > 0 &&
            value === bestValue &&
            best != null &&
            promotionSpecificity(rule) > promotionSpecificity(best.rule));

        if (better) {
          best = evaluation;
          bestValue = value;
        }

        if (
          evaluation.hint &&
          (!hintFrom ||
            promotionSpecificity(rule) >
              promotionSpecificity(hintFrom.rule))
        ) {
          hintFrom = evaluation;
        }
      }
    }

    const promotionDiscount = best
      ? Math.min(subtotal, money(best.discount))
      : 0;
    const freeQuantity = best ? best.freeQuantity : 0;

    const linePromotion: PricedLinePromotion | null = best
      ? {
          id: best.rule.id,
          kind: best.rule.kind as PricedLinePromotion["kind"],
          label: {
            ar: promotionLabel(best.rule, "ar"),
            en: promotionLabel(best.rule, "en"),
          },
          allowWithCoupon: best.rule.allowWithCoupon,
        }
      : null;

    // Show "add 1 more" only for the offer in play: the applied one, or,
    // when none applies yet, the closest matching one.
    const hint = best ? best.hint : hintFrom?.hint || null;

    lines.push({
      key: line.key,
      productId: line.productId,
      variantId: line.variantId,
      quantity,
      freeQuantity,
      baseUnitPrice,
      unitPrice,
      salePercent,
      onSale,
      flashSale: flashWins
        ? {
            promotionId: (flash as PromotionRule).id,
            endsAt: (flash as PromotionRule).endsAt,
          }
        : null,
      subtotal,
      promotionDiscount,
      total: subtotal - promotionDiscount,
      promotion: linePromotion,
      hint,
    });

    if (best && linePromotion) {
      const common = {
        promotionId: best.rule.id,
        promotionName: linePromotion.label.ar,
        labelAr: linePromotion.label.ar,
        labelEn: linePromotion.label.en,
        productId: line.productId,
        variantId: line.variantId,
      };

      if (freeQuantity > 0) {
        applied.push({
          ...common,
          kind: "free_items",
          type: "buy_2_get_1",
          affectedQuantity: freeQuantity,
          discountAmount: freeQuantity * unitPrice,
        });
      }

      if (promotionDiscount > 0) {
        applied.push({
          ...common,
          kind: "line_discount",
          type: "buy_1_second_50",
          affectedQuantity: best.discountedQuantity,
          discountAmount: promotionDiscount,
        });
      }
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const promotionDiscount = lines.reduce(
    (sum, line) => sum + line.promotionDiscount,
    0
  );
  const freeItemsValue = lines.reduce(
    (sum, line) => sum + line.freeQuantity * line.unitPrice,
    0
  );
  const afterPromotions = subtotal - promotionDiscount;

  // 3. Coupon.
  let coupon: CouponOutcome | null = null;

  if (input.coupon) {
    const source = input.coupon;
    const minimumOrderAmount = money(source.minimumOrderAmount);

    coupon = {
      id: source.id,
      code: source.code,
      type: source.type,
      applied: false,
      reason: null,
      discountAmount: 0,
      freeDelivery: false,
      minimumOrderAmount,
    };

    if (afterPromotions < minimumOrderAmount) {
      coupon.reason = "minimum_not_met";
    } else if (source.type === "free_delivery") {
      // Decided with delivery, below.
      coupon.applied = true;
      coupon.freeDelivery = true;
    } else {
      const eligible = lines.reduce((sum, line) => {
        const blockedBySale = line.onSale && !source.appliesToSaleItems;
        const promoted =
          line.promotion != null &&
          (line.promotionDiscount > 0 || line.freeQuantity > 0);
        const blockedByPromotion =
          promoted && !line.promotion?.allowWithCoupon;

        return blockedBySale || blockedByPromotion
          ? sum
          : sum + line.total;
      }, 0);

      let discount =
        source.type === "fixed"
          ? money(source.amount)
          : percentOf(eligible, source.percent);

      const cap = money(source.maximumDiscount);
      if (source.type === "percent" && cap > 0) {
        discount = Math.min(discount, cap);
      }

      discount = Math.min(discount, eligible);

      if (discount > 0) {
        coupon.applied = true;
        coupon.discountAmount = discount;
      } else {
        coupon.reason = "no_eligible_items";
      }
    }
  }

  const couponDiscount = coupon?.applied ? coupon.discountAmount : 0;
  const goodsTotal = Math.max(0, afterPromotions - couponDiscount);

  // 4. Delivery.
  const threshold = money(input.delivery.freeShippingThreshold);
  const configuredFee =
    input.delivery.fee == null ? null : money(input.delivery.fee);

  const freeFromCandidates: number[] = [];
  if (threshold > 0) freeFromCandidates.push(threshold);
  for (const rule of freeDeliveryPromotions) {
    freeFromCandidates.push(money(rule.minimumOrderAmount));
  }

  const freeFrom = freeFromCandidates.length
    ? Math.min(...freeFromCandidates)
    : null;

  let freeReason: FreeDeliveryReason | null = null;
  let freePromotionId: string | null = null;

  if (lines.length > 0) {
    if (threshold > 0 && goodsTotal >= threshold) {
      freeReason = "threshold";
    } else {
      const promotion = freeDeliveryPromotions.find(
        (rule) => goodsTotal >= money(rule.minimumOrderAmount)
      );

      if (promotion) {
        freeReason = "promotion";
        freePromotionId = promotion.id;
      }
    }
  }

  if (coupon?.applied && coupon.type === "free_delivery") {
    if (freeReason || configuredFee === 0) {
      // Delivery is free anyway: do not spend the coupon.
      coupon.applied = false;
      coupon.freeDelivery = false;
      coupon.reason = "delivery_already_free";
    } else {
      freeReason = "coupon";
    }
  }

  const deliveryFee = freeReason ? 0 : configuredFee ?? 0;
  const codFee = money(input.codFee);
  const total = goodsTotal + deliveryFee + codFee;

  const itemsCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const freeItemsCount = lines.reduce(
    (sum, line) => sum + line.freeQuantity,
    0
  );
  const saleSavings = lines.reduce(
    (sum, line) =>
      sum + Math.max(0, line.baseUnitPrice - line.unitPrice) * line.quantity,
    0
  );

  const orderProductsSubtotal = subtotal + freeItemsValue;
  const orderPromotionDiscount = promotionDiscount + freeItemsValue;
  const orderDiscount = orderPromotionDiscount + couponDiscount;

  return {
    lines,
    promotions: applied,
    coupon,
    delivery: {
      fee: configuredFee == null ? null : deliveryFee,
      configuredFee,
      free: freeReason != null,
      freeReason,
      freePromotionId,
      freeFrom,
    },
    totals: {
      itemsCount,
      freeItemsCount,
      saleSavings,
      subtotal,
      promotionDiscount,
      freeItemsValue,
      couponDiscount,
      goodsTotal,
      deliveryFee,
      codFee,
      total,
    },
    order: {
      productsSubtotal: orderProductsSubtotal,
      discountAmount: orderDiscount,
      promotionDiscountAmount: orderPromotionDiscount,
      total,
    },
  };
}
